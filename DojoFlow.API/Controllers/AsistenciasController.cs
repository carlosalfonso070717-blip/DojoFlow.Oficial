using DojoFlow.API.Services;
using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Mensualidades;
using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    [Authorize(Roles = Roles.Dueno + "," + Roles.Coach + "," + Roles.Kiosco)]
    [ApiController]
    [Route("api/[controller]")]
    public class AsistenciasController : ControllerBase
    {
        private readonly IAlumnoRepository _alumnoRepository;
        private readonly IMensualidadRepository _mensualidadRepository;
        private readonly ITenantContext _tenant;
        private readonly GeneradorTokens _tokens;
        private readonly ActualizarMensualidadesUseCase _actualizarMensualidades;

        public AsistenciasController(
            IAlumnoRepository alumnoRepository,
            IMensualidadRepository mensualidadRepository,
            ITenantContext tenant,
            GeneradorTokens tokens,
            ActualizarMensualidadesUseCase actualizarMensualidades)
        {
            _alumnoRepository = alumnoRepository;
            _mensualidadRepository = mensualidadRepository;
            _tenant = tenant;
            _tokens = tokens;
            _actualizarMensualidades = actualizarMensualidades;
        }

        // Vincula una tablet a la academia: un coach la activa y la tablet queda
        // con un token que solo puede registrar asistencias
        [Authorize(Roles = Roles.Dueno + "," + Roles.Coach)]
        [HttpPost("sesion-kiosco")]
        public IActionResult CrearSesionKiosco()
        {
            return Ok(new { Token = _tokens.ParaKiosco(_tenant.AcademiaId) });
        }

        [HttpPost("checar")]
        public async Task<IActionResult> RegistrarAsistencia([FromQuery] string pin)
        {
            if (!EsPinValido(pin, out int pinNum))
            {
                return BadRequest(new { Error = "El PIN debe ser un número exacto de 5 dígitos." });
            }

            var alumno = await _alumnoRepository.ObtenerPorPinAsync(pinNum);
            if (alumno == null)
            {
                return NotFound(new { Error = "PIN incorrecto o alumno no registrado." });
            }

            string estatusFinanciero = await ObtenerEstatusFinancieroAsync(alumno.Id);

            bool permitirAcceso = estatusFinanciero != "Vencido";

            return Ok(new
            {
                NombreCompleto = $"{alumno.Nombre} {alumno.Apellido}",
                Disciplinas = alumno.Disciplinas,
                EstatusFinanciero = estatusFinanciero,
                FechaHora = DateTime.Now.ToString("dd/MM/yyyy hh:mm tt"),
                PermitirAcceso = permitirAcceso
            });
        }

        private bool EsPinValido(string pin, out int pinNum)
        {
            pinNum = 0;
            return !string.IsNullOrWhiteSpace(pin) &&
                   pin.Length == 5 &&
                   int.TryParse(pin, out pinNum);
        }

        private async Task<string> ObtenerEstatusFinancieroAsync(Guid alumnoId)
        {
            // Primero se ponen al día sus recibos (vencer / generar el del mes) y luego se evalúa
            await _actualizarMensualidades.EjecutarParaAlumnoAsync(alumnoId, DateTime.UtcNow);
            var recibos = await _mensualidadRepository.ObtenerPorAlumnoAsync(alumnoId);
            return CicloMensualidades.EstatusActual(recibos);
        }
    }
}
