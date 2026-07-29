using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Observers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    public class AgregarProductoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public int StockMinimo { get; set; }
        public string ImagenUrl { get; set; } = string.Empty;
    }

    public class EditarProductoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public int NuevoStockActual { get; set; }
        public int NuevoStockMinimo { get; set; }
        public string ImagenUrl { get; set; } = string.Empty;
    }

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        private readonly IProductoRepository _productoRepository;
        private readonly IRegistroFinancieroRepository _registroFinancieroRepository;

        public InventarioController(IProductoRepository productoRepository, IRegistroFinancieroRepository registroFinancieroRepository)
        {
            _productoRepository = productoRepository;
            _registroFinancieroRepository = registroFinancieroRepository;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerInventario()
        {
            return Ok(await _productoRepository.ObtenerTodosAsync());
        }

        [HttpGet("alertas")]
        public IActionResult ObtenerAlertas()
        {
            return Ok(AlertaStockObserver.AlertasActivas);
        }

        [HttpPost]
        public async Task<IActionResult> AgregarProducto([FromBody] AgregarProductoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return BadRequest(new { Error = "El nombre del artículo es obligatorio." });

            if (request.Cantidad < 0 || request.StockMinimo < 0)
                return BadRequest(new { Error = "Las cantidades no pueden ser negativas." });

            var nuevoProducto = new Producto(Guid.NewGuid(), request.Nombre, request.Cantidad, request.StockMinimo)
            {
                ImagenUrl = request.ImagenUrl
            };

            await _productoRepository.AgregarAsync(nuevoProducto);

            return StatusCode(201, nuevoProducto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditarProducto(Guid id, [FromBody] EditarProductoRequest request)
        {
            var producto = await _productoRepository.ObtenerPorIdAsync(id);

            if (producto == null)
                return NotFound(new { Error = "Artículo no encontrado." });

            if (request.NuevoStockActual < 0 || request.NuevoStockMinimo < 0)
                return BadRequest(new { Error = "Las cantidades no pueden ser negativas." });

            if (!string.IsNullOrWhiteSpace(request.Nombre))
                producto.Nombre = request.Nombre;

            producto.StockActual = request.NuevoStockActual;
            producto.StockMinimo = request.NuevoStockMinimo;
            producto.ImagenUrl = request.ImagenUrl;

            producto.ReducirStock(0);

            await _productoRepository.ActualizarAsync(producto);

            return Ok(new { Mensaje = "Artículo actualizado exitosamente.", Producto = producto });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProducto(Guid id)
        {
            var producto = await _productoRepository.ObtenerPorIdAsync(id);
            if (producto == null)
                return NotFound(new { Error = "Artículo no encontrado." });

            await _productoRepository.EliminarAsync(producto);

            AlertaStockObserver.AlertasActivas.RemoveAll(a => a.Contains($"'{producto.Nombre}'"));

            return Ok(new { Mensaje = $"El artículo '{producto.Nombre}' fue removido con éxito." });
        }

        [HttpPost("{id}/salida")]
        public async Task<IActionResult> RegistrarSalida(Guid id, [FromQuery] int cantidad = 1, [FromQuery] decimal precioVenta = 0)
        {
            var producto = await _productoRepository.ObtenerPorIdAsync(id);

            if (producto == null)
                return NotFound(new { Error = "Artículo no encontrado." });

            if (producto.StockActual < cantidad)
                return BadRequest(new { Error = "No hay suficiente stock para esta salida." });

            producto.ReducirStock(cantidad);

            await _productoRepository.ActualizarAsync(producto);

            if (precioVenta > 0)
            {
                decimal totalVenta = precioVenta * cantidad;
                await _registroFinancieroRepository.RegistrarIngresoAsync(totalVenta, esVenta: true);
            }

            return Ok(new
            {
                Mensaje = $"Salida registrada. Stock restante de {producto.Nombre}: {producto.StockActual}",
                StockActual = producto.StockActual
            });
        }
    }
}
