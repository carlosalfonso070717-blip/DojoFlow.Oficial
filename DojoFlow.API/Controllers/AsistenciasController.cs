using DojoFlow.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AsistenciasController : ControllerBase
    {
        private readonly IAlumnoRepository _alumnoRepository;
        private readonly IMensualidadRepository _mensualidadRepository;

        public AsistenciasController(IAlumnoRepository alumnoRepository, IMensualidadRepository mensualidadRepository)
        {
            _alumnoRepository = alumnoRepository;
            _mensualidadRepository = mensualidadRepository;
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
                return NotFound(new { Error = "PIN incorrecto o peleador no registrado." });
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
            var mensualidad = await _mensualidadRepository.ObtenerPorAlumnoIdAsync(alumnoId);
            return mensualidad != null ? mensualidad.EstadoActual : "Sin Recibo";
        }
    }
}
