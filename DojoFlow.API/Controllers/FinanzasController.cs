using DojoFlow.API.Services;
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
        private readonly IAcademiaRepository _academiaRepository;
        private readonly ITenantContext _tenant;
        private readonly ILogger<FinanzasController> _logger;

        public FinanzasController(
            IRegistroFinancieroRepository registroFinancieroRepository,
            IAcademiaRepository academiaRepository,
            ITenantContext tenant,
            ILogger<FinanzasController> logger)
        {
            _logger = logger;
            _registroFinancieroRepository = registroFinancieroRepository;
            _academiaRepository = academiaRepository;
            _tenant = tenant;
        }

        // Reporte del mes para descargar: formato=pdf o formato=excel
        [HttpGet("{mesAnio}/reporte")]
        public async Task<IActionResult> DescargarReporte(string mesAnio, [FromQuery] string formato = "pdf")
        {
            var registro = await _registroFinancieroRepository.ObtenerPorMesAsync(mesAnio);
            if (registro == null) return NotFound(new { Error = "No hay movimientos registrados en ese mes." });

            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return Unauthorized();

            var movimientos = await _registroFinancieroRepository.ObtenerTransaccionesAsync(mesAnio);
            var datos = new DatosReporte(academia.Nombre, academia.Moneda, academia.ColorPrimario, mesAnio, registro, movimientos);
            string nombre = $"GestAcademy {academia.Nombre} {GeneradorReportes.NombreMes(mesAnio)}";

            try
            {
                return formato.ToLowerInvariant() switch
                {
                    "excel" or "xlsx" => File(GeneradorReportes.Excel(datos), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{nombre}.xlsx"),
                    "pdf" => File(GeneradorReportes.Pdf(datos), "application/pdf", $"{nombre}.pdf"),
                    _ => BadRequest(new { Error = "El formato debe ser pdf o excel." })
                };
            }
            catch (Exception ex) when (ex is TypeInitializationException or DllNotFoundException || ex.GetType().Namespace?.StartsWith("QuestPDF") == true)
            {
                _logger.LogError(ex, "No se pudo generar el reporte {Formato} de {Mes}", formato, mesAnio);
                return StatusCode(503, new { Error = "No se pudo generar el PDF en este momento. Descarga el reporte en Excel." });
            }
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
