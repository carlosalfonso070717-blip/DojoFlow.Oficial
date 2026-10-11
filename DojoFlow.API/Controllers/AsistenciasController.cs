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
        private readonly IAcademiaRepository _academiaRepository;
        private readonly IAsistenciaRepository _asistenciaRepository;
        private readonly IMensualidadRepository _mensualidadRepository;
        private readonly ITenantContext _tenant;
        private readonly GeneradorTokens _tokens;
        private readonly ActualizarMensualidadesUseCase _actualizarMensualidades;

        public AsistenciasController(
            IAlumnoRepository alumnoRepository,
            IAcademiaRepository academiaRepository,
            IAsistenciaRepository asistenciaRepository,
            IMensualidadRepository mensualidadRepository,
            ITenantContext tenant,
            GeneradorTokens tokens,
            ActualizarMensualidadesUseCase actualizarMensualidades)
        {
            _alumnoRepository = alumnoRepository;
            _academiaRepository = academiaRepository;
            _asistenciaRepository = asistenciaRepository;
            _mensualidadRepository = mensualidadRepository;
            _tenant = tenant;
            _tokens = tokens;
            _actualizarMensualidades = actualizarMensualidades;
        }

        // Vincula una tablet a la academia: un coach la activa y la tablet queda
        // con un token que solo puede registrar asistencias
        [Authorize(Roles = Roles.Dueno + "," + Roles.Coach)]
        [HttpPost("sesion-kiosco")]
        public async Task<IActionResult> CrearSesionKiosco()
        {
            if (!await RegistradorActivoAsync())
                return BadRequest(new { Error = RegistradorDesactivado });
            return Ok(new { Token = _tokens.ParaKiosco(_tenant.AcademiaId) });
        }

        // Reporte: registros entre dos instantes (ISO 8601). Por defecto, los últimos 30 días.
        [Authorize(Roles = Roles.Dueno + "," + Roles.Coach)]
        [HttpGet]
        public async Task<IActionResult> ObtenerRegistros([FromQuery] string? desde, [FromQuery] string? hasta)
        {
            var fin = LeerFecha(hasta) ?? DateTime.UtcNow;
            var inicio = LeerFecha(desde) ?? fin.AddDays(-30);
            if (inicio >= fin) return BadRequest(new { Error = "El inicio del periodo debe ser anterior al final." });
            if ((fin - inicio).TotalDays > 400) return BadRequest(new { Error = "El periodo no puede pasar de un año." });

            var registros = await _asistenciaRepository.ObtenerEntreAsync(inicio, fin);
            return Ok(registros.Select(a => new
            {
                a.Id,
                a.AlumnoId,
                a.NombreAlumno,
                // La columna no guarda zona horaria: se marca como UTC para que el cliente la convierta a su hora
                FechaHora = DateTime.SpecifyKind(a.FechaHora, DateTimeKind.Utc),
                a.PermitirAcceso,
                a.EstatusFinanciero
            }));
        }

        private const string RegistradorDesactivado = "El registrador de asistencias está desactivado. Actívalo en Ajustes.";

        private async Task<bool> RegistradorActivoAsync()
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            return academia?.AsistenciasActivas == true;
        }

        private static DateTime? LeerFecha(string? texto) =>
            DateTimeOffset.TryParse(texto, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.AssumeUniversal, out var fecha)
                ? fecha.UtcDateTime
                : null;

        [HttpPost("checar")]
        public async Task<IActionResult> RegistrarAsistencia([FromQuery] string pin)
        {
            if (!await RegistradorActivoAsync())
                return BadRequest(new { Error = RegistradorDesactivado });

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

            // Cada PIN válido queda en el historial, entre o no, para el reporte de asistencias
            await _asistenciaRepository.AgregarAsync(new Asistencia
            {
                Id = Guid.NewGuid(),
                AlumnoId = alumno.Id,
                NombreAlumno = $"{alumno.Nombre} {alumno.Apellido}".Trim(),
                FechaHora = DateTime.UtcNow,
                PermitirAcceso = permitirAcceso,
                EstatusFinanciero = estatusFinanciero
            });

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
