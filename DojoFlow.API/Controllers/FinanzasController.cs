using DojoFlow.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class FinanzasController : ControllerBase
    {
        private readonly IRegistroFinancieroRepository _registroFinancieroRepository;

        public FinanzasController(IRegistroFinancieroRepository registroFinancieroRepository)
        {
            _registroFinancieroRepository = registroFinancieroRepository;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerHistorial()
        {
            var historial = await _registroFinancieroRepository.ObtenerTodosAsync();
            return Ok(historial);
        }

        [HttpDelete("{mesAnio}")]
        public async Task<IActionResult> EliminarRegistro(string mesAnio)
        {
            var registro = await _registroFinancieroRepository.ObtenerPorMesAsync(mesAnio);
            if (registro == null) return NotFound();

            await _registroFinancieroRepository.EliminarAsync(registro);

            return Ok(new { Mensaje = $"Registro de {mesAnio} eliminado." });
        }
    }
}
