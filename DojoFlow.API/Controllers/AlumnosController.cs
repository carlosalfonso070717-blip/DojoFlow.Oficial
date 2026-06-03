using Microsoft.AspNetCore.Mvc;
using DojoFlow.Application.UseCases.Alumnos;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AlumnosController : ControllerBase
    {
        private readonly RegistrarAlumnoUseCase _registrarAlumnoUseCase;

        // Inyectamos nuestro caso de uso
        public AlumnosController(RegistrarAlumnoUseCase registrarAlumnoUseCase)
        {
            _registrarAlumnoUseCase = registrarAlumnoUseCase;
        }

        [HttpPost]
        public async Task<IActionResult> Registrar([FromBody] RegistrarAlumnoRequest request)
        {
            try
            {
                // Ejecutamos la lógica que está en la capa de Aplicación
                var id = await _registrarAlumnoUseCase.EjecutarAsync(request.Nombre, request.Apellido, request.Telefono);
                return Ok(new { Mensaje = "Alumno registrado con éxito en DojoFlow", Id = id });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

    // DTO: Una clase simple para recibir los datos desde internet sin exponer el Dominio
    public class RegistrarAlumnoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
    }
}