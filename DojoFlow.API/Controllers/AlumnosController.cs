using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Strategies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    public class RegistrarAlumnoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public List<string> Disciplinas { get; set; } = new();
    }

    public class AlumnoVista
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public List<string> Disciplinas { get; set; } = new();
        public decimal CostoMensualidad { get; set; }
        public int ClaveKiosco { get; set; }
    }

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AlumnosController : ControllerBase
    {
        private readonly IAlumnoRepository _alumnoRepository;
        private readonly IMensualidadRepository _mensualidadRepository;

        public AlumnosController(IAlumnoRepository alumnoRepository, IMensualidadRepository mensualidadRepository)
        {
            _alumnoRepository = alumnoRepository;
            _mensualidadRepository = mensualidadRepository;
        }

        private static AlumnoVista AVista(Alumno a) => new AlumnoVista
        {
            Id = a.Id,
            Nombre = $"{a.Nombre} {a.Apellido}",
            Telefono = a.Telefono,
            Disciplinas = a.Disciplinas,
            CostoMensualidad = a.CostoMensualidad,
            ClaveKiosco = a.ClaveKiosco
        };

        [HttpGet]
        public async Task<IActionResult> GetAlumnos()
        {
            var alumnos = await _alumnoRepository.ObtenerTodosAsync();
            return Ok(alumnos.Select(AVista));
        }

        [HttpPost]
        public async Task<IActionResult> RegistrarAlumno([FromBody] RegistrarAlumnoRequest request)
        {
            try
            {
                Alumno nuevoAlumno = new Alumno.Builder()
                    .ConNombre(request.Nombre)
                    .ConApellido(request.Apellido)
                    .ConTelefono(request.Telefono)
                    .ConDisciplinas(request.Disciplinas)
                    .Build();

                var calculadora = new CalculadoraMensualidad(nuevoAlumno.Disciplinas.Count);
                decimal costoMensualidad = calculadora.ObtenerCostoMensual();
                nuevoAlumno.CostoMensualidad = costoMensualidad;

                await _alumnoRepository.GuardarAsync(nuevoAlumno);

                DateTime hoy = DateTime.UtcNow;
                DateTime fechaVencimiento = new DateTime(hoy.Year, hoy.Month, 15);
                if (hoy.Day > 15) fechaVencimiento = fechaVencimiento.AddMonths(1);

                var primeraMensualidad = new Mensualidad(nuevoAlumno.Id, costoMensualidad, fechaVencimiento);
                await _mensualidadRepository.AgregarAsync(primeraMensualidad);

                return StatusCode(201, new
                {
                    Mensaje = $"¡Registro exitoso! Su PIN de acceso es: {nuevoAlumno.ClaveKiosco}",
                    IdAsignado = nuevoAlumno.Id,
                    NombreCompleto = $"{nuevoAlumno.Nombre} {nuevoAlumno.Apellido}",
                    ClaveKioscoAsignada = nuevoAlumno.ClaveKiosco,
                    DisciplinasInscritas = nuevoAlumno.Disciplinas,
                    CostoMensualidadAsignado = $"{costoMensualidad} MXN"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarAlumno(Guid id)
        {
            var alumno = await _alumnoRepository.ObtenerPorIdAsync(id);

            if (alumno == null)
                return NotFound(new { Error = "Peleador no encontrado en el sistema." });

            await _alumnoRepository.EliminarAsync(alumno);
            await _mensualidadRepository.EliminarPorAlumnoIdAsync(id);

            return Ok(new { Mensaje = "El peleador y sus recibos han sido eliminados correctamente." });
        }
    }
}
