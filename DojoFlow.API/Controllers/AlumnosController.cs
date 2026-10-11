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
        private const int IntentosMaximosPin = 20;

        private readonly IAlumnoRepository _alumnoRepository;
        private readonly IMensualidadRepository _mensualidadRepository;
        private readonly IAcademiaRepository _academiaRepository;
        private readonly IClaseRepository _claseRepository;
        private readonly ITenantContext _tenant;

        public AlumnosController(
            IAlumnoRepository alumnoRepository,
            IMensualidadRepository mensualidadRepository,
            IAcademiaRepository academiaRepository,
            IClaseRepository claseRepository,
            ITenantContext tenant)
        {
            _alumnoRepository = alumnoRepository;
            _mensualidadRepository = mensualidadRepository;
            _academiaRepository = academiaRepository;
            _claseRepository = claseRepository;
            _tenant = tenant;
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
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return Unauthorized();

            // Las clases elegidas deben existir y estar activas en esta academia
            var clasesActivas = (await _claseRepository.ObtenerTodasAsync()).Where(c => c.Activa).ToList();
            var nombresPedidos = request.Disciplinas.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var clasesInscritas = clasesActivas
                .Where(c => nombresPedidos.Contains(c.Nombre, StringComparer.OrdinalIgnoreCase))
                .ToList();

            if (nombresPedidos.Count == 0)
                return BadRequest(new { Error = "Selecciona al menos una clase." });
            if (clasesInscritas.Count != nombresPedidos.Count)
                return BadRequest(new { Error = "Alguna de las clases seleccionadas no existe o está inactiva." });

            try
            {
                Alumno nuevoAlumno = new Alumno.Builder()
                    .ConNombre(request.Nombre)
                    .ConApellido(request.Apellido)
                    .ConTelefono(request.Telefono)
                    .ConDisciplinas(clasesInscritas.Select(c => c.Nombre).ToList())
                    .Build();

                nuevoAlumno.ClaveKiosco = await GenerarPinDisponibleAsync(nuevoAlumno.ClaveKiosco);

                var calculadora = new CalculadoraMensualidad(academia, clasesInscritas);
                decimal costoMensualidad = calculadora.ObtenerCostoMensual();
                nuevoAlumno.CostoMensualidad = costoMensualidad;

                await _alumnoRepository.GuardarAsync(nuevoAlumno);

                var fechaVencimiento = academia.CalcularPrimerVencimiento(DateTime.UtcNow);
                var primeraMensualidad = new Mensualidad(nuevoAlumno.Id, costoMensualidad, fechaVencimiento);
                await _mensualidadRepository.AgregarAsync(primeraMensualidad);

                return StatusCode(201, new
                {
                    Mensaje = $"¡Registro exitoso! Su PIN de acceso es: {nuevoAlumno.ClaveKiosco}",
                    IdAsignado = nuevoAlumno.Id,
                    NombreCompleto = $"{nuevoAlumno.Nombre} {nuevoAlumno.Apellido}",
                    ClaveKioscoAsignada = nuevoAlumno.ClaveKiosco,
                    DisciplinasInscritas = nuevoAlumno.Disciplinas,
                    CostoMensualidadAsignado = $"{costoMensualidad} {academia.Moneda}"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        // El PIN debe ser único dentro de la academia para que el kiosco identifique a una sola persona
        private async Task<int> GenerarPinDisponibleAsync(int propuesto)
        {
            int pin = propuesto;
            for (int intento = 0; intento < IntentosMaximosPin; intento++)
            {
                if (!await _alumnoRepository.ExistePinAsync(pin)) return pin;
                pin = Random.Shared.Next(10000, 100000);
            }
            throw new ArgumentException("No se pudo generar un PIN disponible. Intenta de nuevo.");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarAlumno(Guid id)
        {
            var alumno = await _alumnoRepository.ObtenerPorIdAsync(id);

            if (alumno == null)
                return NotFound(new { Error = "Alumno no encontrado en el sistema." });

            await _alumnoRepository.EliminarAsync(alumno);
            await _mensualidadRepository.EliminarPorAlumnoIdAsync(id);

            return Ok(new { Mensaje = "El alumno y sus recibos han sido eliminados correctamente." });
        }
    }
}
