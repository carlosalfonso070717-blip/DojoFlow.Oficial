using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Observers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

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
        private static readonly string ArchivoJson = "inventario.json";

        // Base de datos persistente para el catálogo
        public static readonly List<Producto> _catalogo;
        private static readonly AlertaStockObserver _vigia = new AlertaStockObserver();

        static InventarioController()
        {
            if (System.IO.File.Exists(ArchivoJson))
            {
                try
                {
                    string jsonExistente = System.IO.File.ReadAllText(ArchivoJson);
                    _catalogo = JsonSerializer.Deserialize<List<Producto>>(jsonExistente)
                                ?? new List<Producto>();

                    // Muy importante: Al reconstruir los objetos desde JSON, volvemos a suscribir el Patrón Observer
                    foreach (var producto in _catalogo)
                    {
                        producto.Suscribir(_vigia);
                    }
                }
                catch
                {
                    _catalogo = new List<Producto>();
                    GenerarCatalogoInicial();
                }
            }
            else
            {
                _catalogo = new List<Producto>();
                GenerarCatalogoInicial();
                GuardarEnJson();
            }
        }

        private static void GenerarCatalogoInicial()
        {
            AgregarProductoInicial("Cinturón (Todos los colores)", 10, 3, "");
            AgregarProductoInicial("Guantes de 16 oz", 10, 3, "");
            AgregarProductoInicial("Guantes de 14 oz", 10, 3, "");
            AgregarProductoInicial("Espinilleras Fighter Legend", 10, 2, "");
            AgregarProductoInicial("Bucales de GuardPro", 10, 4, "");
            AgregarProductoInicial("Aguas", 10, 5, "");
        }

        private static void AgregarProductoInicial(string nombre, int stock, int minimo, string imagenUrl)
        {
            var p = new Producto(Guid.NewGuid(), nombre, stock, minimo)
            {
                ImagenUrl = imagenUrl
            };
            p.Suscribir(_vigia);
            _catalogo.Add(p);
        }

        private static void GuardarEnJson()
        {
            var opciones = new JsonSerializerOptions { WriteIndented = true };
            string jsonTexto = JsonSerializer.Serialize(_catalogo, opciones);
            System.IO.File.WriteAllText(ArchivoJson, jsonTexto);
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

            var nuevoProducto = new Producto(Guid.NewGuid(), request.Nombre, request.Cantidad, request.StockMinimo) {

                ImagenUrl = request.ImagenUrl
            };

            nuevoProducto.Suscribir(_vigia);
            _catalogo.Add(nuevoProducto);

            // 🔥 GUARDADO AUTOMÁTICO: Guarda el nuevo artículo en el archivo plano
            GuardarEnJson();

            return StatusCode(201, nuevoProducto);
        }

        [HttpPut("{id}")]
        public IActionResult EditarProducto(Guid id, [FromBody] EditarProductoRequest request)
        {
            var producto = _catalogo.FirstOrDefault(p => p.Id == id);

            if (producto == null)
                return NotFound(new { Error = "Artículo no encontrado." });

            if (request.NuevoStockActual < 0 || request.NuevoStockMinimo < 0)
                return BadRequest(new { Error = "Las cantidades no pueden ser negativas." });

            // Actualizamos todos los valores con los nuevos datos recibidos
            if (!string.IsNullOrWhiteSpace(request.Nombre))
                producto.Nombre = request.Nombre;

            producto.StockActual = request.NuevoStockActual;
            producto.StockMinimo = request.NuevoStockMinimo;
            producto.ImagenUrl = request.ImagenUrl;

            producto.ReducirStock(0);

            GuardarEnJson();

            return Ok(new { Mensaje = "Artículo actualizado exitosamente.", Producto = producto });
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteProducto(Guid id)
        {
            var producto = _catalogo.FirstOrDefault(p => p.Id == id);
            if (producto == null)
                return NotFound(new { Error = "Artículo no encontrado." });

            _catalogo.Remove(producto);

            AlertaStockObserver.AlertasActivas.RemoveAll(a => a.Contains($"'{producto.Nombre}'"));

            // 🔥 GUARDADO AUTOMÁTICO: Sincroniza el JSON tras la eliminación
            GuardarEnJson();

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

            producto.ReducirStock(cantidad);

            // 🔥 GUARDADO AUTOMÁTICO: Guarda los nuevos niveles de Stock en el JSON
            GuardarEnJson();

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