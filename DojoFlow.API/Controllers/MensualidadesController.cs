using Microsoft.AspNetCore.Mvc;
using DojoFlow.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MensualidadesController : ControllerBase
    {
        public static readonly List<Mensualidad> _tablaMensualidades = new List<Mensualidad>
        {
            new Mensualidad(Guid.Parse("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"), 1500.00m, new DateTime(2026, 06, 15))
        };

        [HttpGet]
        public IActionResult ObtenerMensualidades()
        {
            var resultado = _tablaMensualidades.Select(m =>
            {
                // Le decimos que busque en AlumnosController
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
                return Ok(new { Mensaje = "¡Pago registrado exitosamente!", NuevoEstado = mensualidad.EstadoActual });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}