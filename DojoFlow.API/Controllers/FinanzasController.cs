using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace DojoFlow.API.Controllers
{
    public class RegistroFinanciero
    {
        public string MesAnio { get; set; } = string.Empty; // Ejemplo: "06-2026"
        public decimal IngresosMensualidades { get; set; }
        public decimal IngresosVentas { get; set; }
        public decimal Total => IngresosMensualidades + IngresosVentas;
        public int VentasRealizadas { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class FinanzasController : ControllerBase
    {
        private static readonly string ArchivoJson = "finanzas.json";

        // Lista estática administrada mediante el JSON
        public static readonly List<RegistroFinanciero> HistorialFinanciero;

        // Constructor estático para cargar el historial persistente
        static FinanzasController()
        {
            if (System.IO.File.Exists(ArchivoJson))
            {
                try
                {
                    string jsonExistente = System.IO.File.ReadAllText(ArchivoJson);
                    HistorialFinanciero = JsonSerializer.Deserialize<List<RegistroFinanciero>>(jsonExistente)
                                         ?? new List<RegistroFinanciero>();
                }
                catch
                {
                    HistorialFinanciero = GenerarDatosSemilla();
                }
            }
            else
            {
                HistorialFinanciero = GenerarDatosSemilla();
                GuardarEnJson();
            }
        }

        private static List<RegistroFinanciero> GenerarDatosSemilla()
        {
            return new List<RegistroFinanciero>
            {
                new RegistroFinanciero { MesAnio = "04-2026", IngresosMensualidades = 15000, IngresosVentas = 4500, VentasRealizadas = 20 },
                new RegistroFinanciero { MesAnio = "05-2026", IngresosMensualidades = 18500, IngresosVentas = 3200, VentasRealizadas = 15 }
            };
        }

        private static void GuardarEnJson()
        {
            var opciones = new JsonSerializerOptions { WriteIndented = true };
            string jsonTexto = JsonSerializer.Serialize(HistorialFinanciero, opciones);
            System.IO.File.WriteAllText(ArchivoJson, jsonTexto);
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

            // 🔥 GUARDADO AUTOMÁTICO: Guarda el balance financiero cada vez que ingresa dinero
            GuardarEnJson();
        }

        [HttpDelete("{mesAnio}")]
        public IActionResult EliminarRegistro(string mesAnio)
        {
            var registro = HistorialFinanciero.FirstOrDefault(f => f.MesAnio == mesAnio);
            if (registro == null) return NotFound();

            HistorialFinanciero.Remove(registro);

            // 🔥 GUARDADO AUTOMÁTICO: Sincroniza el JSON tras eliminar un mes
            GuardarEnJson();

            return Ok(new { Mensaje = $"Registro de {mesAnio} eliminado." });
        }
    }
}