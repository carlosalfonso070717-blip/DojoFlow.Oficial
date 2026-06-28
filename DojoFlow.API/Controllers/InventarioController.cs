// Ubicación: DojoFlow.API/Controllers/InventarioController.cs
using Microsoft.AspNetCore.Mvc;
using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Observers;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DojoFlow.API.Controllers
{
    // DTO para recibir los datos desde el formulario web
    public class AgregarProductoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public int StockMinimo { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class InventarioController : ControllerBase
    {
        // Base de datos en memoria para el Inventario
        public static readonly List<Producto> _catalogo = new List<Producto>();
        private static readonly AlertaStockObserver _vigia = new AlertaStockObserver();

        // Constructor estático para cargar datos iniciales
        static InventarioController()
        {
            AgregarProductoInicial("Cinturón (Todos los colores)", 10, 3);
            AgregarProductoInicial("Guantes de 16 oz", 10, 3);
            AgregarProductoInicial("Guantes de 14 oz", 10, 3);
            AgregarProductoInicial("Espinilleras Fighter Legend", 10, 2);
            AgregarProductoInicial("Bucales de GuardPro", 10, 4);
            AgregarProductoInicial("Aguas", 10, 5);
        }

        private static void AgregarProductoInicial(string nombre, int stock, int minimo)
        {
            var p = new Producto(Guid.NewGuid(), nombre, stock, minimo);
            p.Suscribir(_vigia);
            _catalogo.Add(p);
        }

        [HttpGet]
        public IActionResult ObtenerInventario()
        {
            return Ok(_catalogo);
        }

        [HttpGet("alertas")]
        public IActionResult ObtenerAlertas()
        {
            return Ok(AlertaStockObserver.AlertasActivas);
        }

        [HttpPost]
        public IActionResult AgregarProducto([FromBody] AgregarProductoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return BadRequest(new { Error = "El nombre del artículo es obligatorio." });

            if (request.Cantidad < 0 || request.StockMinimo < 0)
                return BadRequest(new { Error = "Las cantidades no pueden ser negativas." });

            var nuevoProducto = new Producto(Guid.NewGuid(), request.Nombre, request.Cantidad, request.StockMinimo);

            // Suscribimos al vigía para el Patrón Observer
            nuevoProducto.Suscribir(_vigia);
            _catalogo.Add(nuevoProducto);

            return StatusCode(201, nuevoProducto);
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarProducto(Guid id)
        {
            var producto = _catalogo.FirstOrDefault(p => p.Id == id);
            if (producto == null)
                return NotFound(new { Error = "Artículo no encontrado." });

            _catalogo.Remove(producto);

            // Limpieza: Removemos las alertas viejas de la memoria asociadas a este producto
            AlertaStockObserver.AlertasActivas.RemoveAll(a => a.Contains($"'{producto.Nombre}'"));

            return Ok(new { Mensaje = $"El artículo '{producto.Nombre}' fue removido con éxito." });
        }

        [HttpPost("{id}/salida")]
        public IActionResult RegistrarSalida(Guid id, [FromQuery] int cantidad = 1, [FromQuery] decimal precioVenta = 0)
        {
            var producto = _catalogo.FirstOrDefault(p => p.Id == id);

            if (producto == null)
                return NotFound(new { Error = "Artículo no encontrado." });

            if (producto.StockActual < cantidad)
                return BadRequest(new { Error = "No hay suficiente stock para esta salida." });

            // Reducimos el stock (El patrón Observer actuará automáticamente si se llega al mínimo)
            producto.ReducirStock(cantidad);

            // 🔥 INTEGRACIÓN CON FINANZAS 🔥
            // Si la salida de almacén tuvo un precio de venta, lo mandamos al libro contable
            if (precioVenta > 0)
            {
                decimal totalVenta = precioVenta * cantidad;
                FinanzasController.RegistrarIngreso(totalVenta, esVenta: true);
            }

            return Ok(new
            {
                Mensaje = $"Salida registrada. Stock restante de {producto.Nombre}: {producto.StockActual}",
                StockActual = producto.StockActual
            });
        }
    }
}