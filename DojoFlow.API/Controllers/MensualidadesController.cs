using DojoFlow.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

namespace DojoFlow.API.Controllers
{

    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class MensualidadesController : ControllerBase
    {
        private static readonly string ArchivoJson = "mensualidades.json";
        public static readonly List<Mensualidad> _tablaMensualidades;

        // Constructor estático: lee o crea el archivo al arrancar
        static MensualidadesController()
        {
            if (System.IO.File.Exists(ArchivoJson))
            {
                try
                {
                    string jsonExistente = System.IO.File.ReadAllText(ArchivoJson);
                    _tablaMensualidades = JsonSerializer.Deserialize<List<Mensualidad>>(jsonExistente)
                                          ?? new List<Mensualidad>();
                }
                catch
                {
                    _tablaMensualidades = GenerarDatosSemilla();
                }
            }
            else
            {
                _tablaMensualidades = GenerarDatosSemilla();
                GuardarEnJson();
            }
        }

        private static List<Mensualidad> GenerarDatosSemilla()
        {
            return new List<Mensualidad>
            {
                new Mensualidad(Guid.Parse("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"), 1500.00m, new DateTime(2026, 06, 15))
            };
        }

        // 🔥 MÉTODO PÚBLICO para guardar cambios en el disco duro
        public static void GuardarEnJson()
        {
            var opciones = new JsonSerializerOptions { WriteIndented = true };
            string jsonTexto = JsonSerializer.Serialize(_tablaMensualidades, opciones);
            System.IO.File.WriteAllText(ArchivoJson, jsonTexto);
        }

        [HttpGet]
        public IActionResult ObtenerMensualidades()
        {
            var resultado = _tablaMensualidades.Select(m =>
            {
                var alumno = AlumnosController._baseDeDatosEnMemoria
                    .FirstOrDefault(a => a.Id == m.AlumnoId);

                string nombreAlumno = alumno != null ? alumno.Nombre : "Peleador Desconocido";
                string claveKiosco = alumno != null ? alumno.ClaveKiosco.ToString() : "N/A";

                return new
                {
                    Id = m.Id,
                    AlumnoId = m.AlumnoId,
                    NombreAlumno = nombreAlumno,
                    ClaveKiosco = claveKiosco,
                    Monto = m.Monto,
                    Estado = m.EstadoActual,
                    FechaVencimiento = m.FechaVencimiento.ToString("dd/MM/yyyy"),
                    FechaPago = m.FechaPago?.ToString("dd/MM/yyyy") ?? "---"
                };
            });

            return Ok(resultado);
        }

        [HttpPost("{id}/pagar")]
        public IActionResult PagarMensualidad(Guid id)
        {
            var mensualidad = _tablaMensualidades.FirstOrDefault(m => m.Id == id);

            if (mensualidad == null)
                return NotFound(new { Error = "Recibo no encontrado." });

            try
            {
                mensualidad.Pagar();

                // GUARDADO AUTOMÁTICO: Actualiza el JSON tras el pago
                GuardarEnJson();

                FinanzasController.RegistrarIngreso(mensualidad.Monto, false);
                return Ok(new { Mensaje = "¡Pago registrado exitosamente!", NuevoEstado = mensualidad.EstadoActual });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}