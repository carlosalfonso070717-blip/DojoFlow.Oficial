using Microsoft.AspNetCore.Mvc;
using DojoFlow.Application.UseCases.Alumnos;

namespace DojoFlow.API.Controllers
{
    // 1. CREAMOS EL MOLDE PARA EL FORMULARIO (Puedes ponerlo aquí mismo al final o en otra carpeta)
    public class RegistrarAlumnoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Peso { get; set; } = string.Empty;
        public string Disciplina { get; set; } = string.Empty;
        public string Nivel { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AlumnosController : ControllerBase
    {
        private readonly RegistrarAlumnoUseCase _registrarAlumnoUseCase;

        public AlumnosController(RegistrarAlumnoUseCase registrarAlumnoUseCase)
        {
            _registrarAlumnoUseCase = registrarAlumnoUseCase;
        }

        [HttpGet]
        public IActionResult GetAlumnos()
        {
            var alumnos = new[] {
                new { Id = 1, Nombre = "Carlos Llanes", Peso = "77kg", Disciplina = "MMA", Nivel = "Pro", Estatus = "Activo" },
                new { Id = 2, Nombre = "Alex Pereira", Peso = "93kg", Disciplina = "Kickboxing", Nivel = "Avanzado", Estatus = "Activo" },
                new { Id = 3, Nombre = "Islam Makhachev", Peso = "70kg", Disciplina = "Sambo / Grappling", Nivel = "Pro", Estatus = "Activo" }
            };

            return Ok(alumnos);
        }

        // 2. CAMBIAMOS 'object' POR NUESTRO NUEVO MOLDE 'RegistrarAlumnoRequest'
        [HttpPost]
        public IActionResult RegistrarAlumno([FromBody] RegistrarAlumnoRequest nuevoAlumno)
        {
            return StatusCode(201, new
            {
                Mensaje = $"El peleador {nuevoAlumno.Nombre} fue registrado correctamente en el tatami.",
                DatosRegistrados = nuevoAlumno
            });
        }
    }
}