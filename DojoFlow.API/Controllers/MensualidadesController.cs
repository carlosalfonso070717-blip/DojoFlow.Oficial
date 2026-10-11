using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Mensualidades;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MensualidadesController : ControllerBase
    {
        private readonly IMensualidadRepository _mensualidadRepository;
        private readonly IAlumnoRepository _alumnoRepository;
        private readonly IRegistroFinancieroRepository _registroFinancieroRepository;
        private readonly ActualizarMensualidadesUseCase _actualizarMensualidades;

        public MensualidadesController(
            IMensualidadRepository mensualidadRepository,
            IAlumnoRepository alumnoRepository,
            IRegistroFinancieroRepository registroFinancieroRepository,
            ActualizarMensualidadesUseCase actualizarMensualidades)
        {
            _actualizarMensualidades = actualizarMensualidades;
            _mensualidadRepository = mensualidadRepository;
            _alumnoRepository = alumnoRepository;
            _registroFinancieroRepository = registroFinancieroRepository;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerMensualidades()
        {
            // Pone al día los estados antes de mostrarlos (vencidos y recibos del mes siguiente)
            await _actualizarMensualidades.EjecutarAsync(DateTime.UtcNow);
            var mensualidades = await _mensualidadRepository.ObtenerTodasAsync();
            var alumnos = await _alumnoRepository.ObtenerTodosAsync();

            var resultado = mensualidades.Select(m =>
            {
                var alumno = alumnos.FirstOrDefault(a => a.Id == m.AlumnoId);

                string nombreAlumno = alumno != null ? $"{alumno.Nombre} {alumno.Apellido}" : "Alumno desconocido";
                string claveKiosco = alumno != null ? alumno.ClaveKiosco.ToString() : "N/A";

                return new
                {
                    Id = m.Id,
                    AlumnoId = m.AlumnoId,
                    NombreAlumno = nombreAlumno,
                    ClaveKiosco = claveKiosco,
                    Monto = m.Monto,
                    Estado = m.EstadoActual,
                    FechaVencimiento = m.FechaVencimiento.ToString("dd/MM/yyyy"),
                    FechaPago = m.FechaPago?.ToString("dd/MM/yyyy") ?? "---"
                };
            });

            return Ok(resultado);
        }

        [HttpPost("{id}/pagar")]
        public async Task<IActionResult> PagarMensualidad(Guid id)
        {
            var mensualidad = await _mensualidadRepository.ObtenerPorIdAsync(id);

            if (mensualidad == null)
                return NotFound(new { Error = "Recibo no encontrado." });

            try
            {
                mensualidad.Pagar();

                await _mensualidadRepository.ActualizarAsync(mensualidad);
                await _registroFinancieroRepository.RegistrarIngresoAsync(mensualidad.Monto, false);
                // Si se pagó tarde, el recibo del mes siguiente puede tocar ya
                await _actualizarMensualidades.EjecutarParaAlumnoAsync(mensualidad.AlumnoId, DateTime.UtcNow);

                return Ok(new { Mensaje = "¡Pago registrado exitosamente!", NuevoEstado = mensualidad.EstadoActual });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}
