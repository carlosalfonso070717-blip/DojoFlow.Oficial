using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlumnosController : ControllerBase
    {
        // Este endpoint será llamado por la tablet de recepción para ver a los alumnos
        [HttpGet]
        public IActionResult GetAlumnos()
        {
            var alumnos = new[] {
                new { Id = 1, Nombre = "Carlos Llanes", Peso = "77kg", Disciplina = "MMA", Nivel = "Pro", Estatus = "Activo" },
                new { Id = 2, Nombre = "Alex Pereira", Peso = "93kg", Disciplina = "Kickboxing", Nivel = "Avanzado", Estatus = "Activo" },
                new { Id = 3, Nombre = "Islam Makhachev", Peso = "70kg", Disciplina = "Sambo / Grappling", Nivel = "Pro", Estatus = "Activo" },
                new { Id = 4, Nombre = "Max Holloway", Peso = "65kg", Disciplina = "Boxeo", Nivel = "Intermedio", Estatus = "En recuperación" }
            };

            return Ok(alumnos);
        }
      // Este endpoint será usado por el coach para dar de alta a un nuevo peleador
        [HttpPost]
        public IActionResult RegistrarAlumno([FromBody] object nuevoAlumno)
        {
            // Más adelante aquí inyectaremos tu RegistrarAlumnoUseCase real
            return StatusCode(201, new { Mensaje = "Peleador registrado correctamente en el tatami de Dominio Combat Club" });
        }
    }
}