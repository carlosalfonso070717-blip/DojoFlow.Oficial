// Ubicación: DojoFlow.API/Controllers/FinanzasController.cs
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DojoFlow.API.Controllers
{
    public class RegistroFinanciero
    {
        public string MesAnio { get; set; } // Ejemplo: "06-2026"
        public decimal IngresosMensualidades { get; set; }
        public decimal IngresosVentas { get; set; }
        public decimal Total => IngresosMensualidades + IngresosVentas;
        public int VentasRealizadas { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class FinanzasController : ControllerBase
    {
        // Diccionario para persistir los meses en memoria
        public static List<RegistroFinanciero> HistorialFinanciero = new List<RegistroFinanciero>();

        static FinanzasController()
        {
            // Datos de ejemplo para ver el historial de meses anteriores
            HistorialFinanciero.Add(new RegistroFinanciero { MesAnio = "04-2026", IngresosMensualidades = 15000, IngresosVentas = 4500, VentasRealizadas = 20 });
            HistorialFinanciero.Add(new RegistroFinanciero { MesAnio = "05-2026", IngresosMensualidades = 18500, IngresosVentas = 3200, VentasRealizadas = 15 });
        }

        [HttpGet]
        public IActionResult ObtenerHistorial()
        {
            return Ok(HistorialFinanciero.OrderByDescending(f => f.MesAnio));
        }

        // Método que será llamado desde otros controladores al recibir dinero
        public static void RegistrarIngreso(decimal monto, bool esVenta)
        {
            string mesActual = DateTime.Now.ToString("MM-yyyy");
            var registro = HistorialFinanciero.FirstOrDefault(f => f.MesAnio == mesActual);

            if (registro == null)
            {
                registro = new RegistroFinanciero { MesAnio = mesActual };
                HistorialFinanciero.Add(registro);
            }

            if (esVenta)
            {
                registro.IngresosVentas += monto;
                registro.VentasRealizadas++;
            }
            else
            {
                registro.IngresosMensualidades += monto;
            }
        }

        [HttpDelete("{mesAnio}")]
        public IActionResult EliminarRegistro(string mesAnio)
        {
            var registro = HistorialFinanciero.FirstOrDefault(f => f.MesAnio == mesAnio);
            if (registro == null) return NotFound();
            HistorialFinanciero.Remove(registro);
            return Ok(new { Mensaje = $"Registro de {mesAnio} eliminado." });
        }
    }
}