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
        public decimal Precio { get; set; }
        public bool EnCatalogo { get; set; } = true;
    }

    public class EditarProductoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public int NuevoStockActual { get; set; }
        public int NuevoStockMinimo { get; set; }
        public string ImagenUrl { get; set; } = string.Empty;
        // Opcionales: si no se mandan (p. ej. desde la web anterior) se conservan los actuales
        public decimal? Precio { get; set; }
        public bool? EnCatalogo { get; set; }
    }

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        private readonly IProductoRepository _productoRepository;
        private readonly IRegistroFinancieroRepository _registroFinancieroRepository;
        private readonly IImagenRepository _imagenRepository;
        private readonly ITenantContext _tenant;

        public InventarioController(
            IProductoRepository productoRepository,
            IRegistroFinancieroRepository registroFinancieroRepository,
            IImagenRepository imagenRepository,
            ITenantContext tenant)
        {
            _productoRepository = productoRepository;
            _registroFinancieroRepository = registroFinancieroRepository;
            _imagenRepository = imagenRepository;
            _tenant = tenant;
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerInventario()
        {
            return Ok(await _productoRepository.ObtenerTodosAsync());
        }

        [HttpGet("alertas")]
        public IActionResult ObtenerAlertas()
        {
            return Ok(AlertaStockObserver.ObtenerAlertas(_tenant.AcademiaId));
        }

        [HttpPost]
        public async Task<IActionResult> AgregarProducto([FromBody] AgregarProductoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return BadRequest(new { Error = "El nombre del artículo es obligatorio." });

            if (request.Cantidad < 0 || request.StockMinimo < 0)
                return BadRequest(new { Error = "Las cantidades no pueden ser negativas." });

            if (request.Precio < 0)
                return BadRequest(new { Error = "El precio no puede ser negativo." });

            var nuevoProducto = new Producto(Guid.NewGuid(), request.Nombre, request.Cantidad, request.StockMinimo)
            {
                ImagenUrl = request.ImagenUrl,
                Precio = request.Precio,
                EnCatalogo = request.EnCatalogo
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
            // Una foto subida solo cambia con PUT/DELETE {id}/imagen, así no queda huérfana
            if (Imagen.IdDesdeUrl(producto.ImagenUrl) == null)
                producto.ImagenUrl = request.ImagenUrl;
            if (request.Precio is < 0)
                return BadRequest(new { Error = "El precio no puede ser negativo." });
            if (request.Precio.HasValue) producto.Precio = request.Precio.Value;
            if (request.EnCatalogo.HasValue) producto.EnCatalogo = request.EnCatalogo.Value;

            // Si se resurtió, la alerta deja de aplicar; si sigue bajo, ReducirStock(0) la regenera
            AlertaStockObserver.QuitarAlertasDe(producto.AcademiaId, producto.Nombre);
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
            await _imagenRepository.EliminarPorUrlAsync(producto.ImagenUrl);

            AlertaStockObserver.QuitarAlertasDe(producto.AcademiaId, producto.Nombre);

            return Ok(new { Mensaje = $"El artículo '{producto.Nombre}' fue removido con éxito." });
        }

        // Foto del producto (se ve en la app y en el catálogo); reemplaza a la anterior
        [HttpPut("{id}/imagen")]
        [RequestSizeLimit(ImagenesController.TamanoMaximo + 64 * 1024)]
        public async Task<IActionResult> SubirImagen(Guid id, IFormFile archivo)
        {
            var producto = await _productoRepository.ObtenerPorIdAsync(id);
            if (producto == null)
                return NotFound(new { Error = "Artículo no encontrado." });

            var (imagen, error) = await ImagenesController.LeerAsync(archivo);
            if (imagen == null) return BadRequest(new { Error = error });

            await _imagenRepository.AgregarAsync(imagen);
            var anterior = producto.ImagenUrl;
            producto.ImagenUrl = imagen.Url;
            await _productoRepository.ActualizarAsync(producto);
            await _imagenRepository.EliminarPorUrlAsync(anterior);

            return Ok(producto);
        }

        [HttpDelete("{id}/imagen")]
        public async Task<IActionResult> QuitarImagen(Guid id)
        {
            var producto = await _productoRepository.ObtenerPorIdAsync(id);
            if (producto == null)
                return NotFound(new { Error = "Artículo no encontrado." });

            var anterior = producto.ImagenUrl;
            producto.ImagenUrl = string.Empty;
            await _productoRepository.ActualizarAsync(producto);
            await _imagenRepository.EliminarPorUrlAsync(anterior);

            return Ok(producto);
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
                await _registroFinancieroRepository.RegistrarIngresoAsync(totalVenta, esVenta: true, producto.Nombre, cantidad);
            }

            return Ok(new
            {
                Mensaje = $"Salida registrada. Stock restante de {producto.Nombre}: {producto.StockActual}",
                StockActual = producto.StockActual
            });
        }
    }
}
