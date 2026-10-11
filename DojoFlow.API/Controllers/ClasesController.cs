using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    public class GuardarClaseRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public decimal Precio { get; set; }
        public bool Activa { get; set; } = true;
    }

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ClasesController : ControllerBase
    {
        private readonly IClaseRepository _claseRepository;

        public ClasesController(IClaseRepository claseRepository)
        {
            _claseRepository = claseRepository;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerClases()
        {
            return Ok(await _claseRepository.ObtenerTodasAsync());
        }

        [Authorize(Roles = Roles.Dueno)]
        [HttpPost]
        public async Task<IActionResult> CrearClase([FromBody] GuardarClaseRequest request)
        {
            Clase clase;
            try
            {
                clase = new Clase(request.Nombre, request.Precio);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }

            var existentes = await _claseRepository.ObtenerTodasAsync();
            if (existentes.Any(c => c.Nombre.Equals(clase.Nombre, StringComparison.OrdinalIgnoreCase)))
                return BadRequest(new { Error = $"Ya existe una clase llamada '{clase.Nombre}'." });

            await _claseRepository.AgregarAsync(clase);
            return StatusCode(201, clase);
        }

        [Authorize(Roles = Roles.Dueno)]
        [HttpPut("{id}")]
        public async Task<IActionResult> EditarClase(Guid id, [FromBody] GuardarClaseRequest request)
        {
            var clase = await _claseRepository.ObtenerPorIdAsync(id);
            if (clase == null) return NotFound(new { Error = "Clase no encontrada." });

            if (string.IsNullOrWhiteSpace(request.Nombre))
                return BadRequest(new { Error = "El nombre de la clase es obligatorio." });
            if (request.Precio < 0)
                return BadRequest(new { Error = "El precio no puede ser negativo." });

            // El nombre no se puede cambiar porque los alumnos guardan sus clases por nombre
            if (!clase.Nombre.Equals(request.Nombre.Trim(), StringComparison.Ordinal))
                return BadRequest(new { Error = "Para renombrar una clase, crea una nueva y desactiva la anterior." });

            clase.Precio = request.Precio;
            clase.Activa = request.Activa;
            await _claseRepository.ActualizarAsync(clase);
            return Ok(clase);
        }

        [Authorize(Roles = Roles.Dueno)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarClase(Guid id)
        {
            var clase = await _claseRepository.ObtenerPorIdAsync(id);
            if (clase == null) return NotFound(new { Error = "Clase no encontrada." });

            await _claseRepository.EliminarAsync(clase);
            return Ok(new { Mensaje = $"La clase '{clase.Nombre}' fue eliminada." });
        }
    }
}
