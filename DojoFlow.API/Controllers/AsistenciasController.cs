// Ubicación: DojoFlow.API/Controllers/AsistenciasController.cs
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AsistenciasController : ControllerBase
    {
        [HttpPost("checar")]
        public IActionResult RegistrarAsistencia([FromQuery] string pin)
        {
            if (string.IsNullOrWhiteSpace(pin) || pin.Length != 5 || !int.TryParse(pin, out int pinNum))
            {
                return BadRequest(new { Error = "El PIN debe ser un número exacto de 5 dígitos." });
            }

            // 1. Buscamos al alumno por su PIN de Kiosco
            var alumno = AlumnosController._baseDeDatosEnMemoria
                .FirstOrDefault(a => a.ClaveKiosco == pinNum);

            if (alumno == null)
            {
                return NotFound(new { Error = "PIN incorrecto o peleador no registrado." });
            }

            // 2. Consultamos su estatus financiero actual cruzando datos con MensualidadesController
            var mensualidad = MensualidadesController._tablaMensualidades
                .FirstOrDefault(m => m.AlumnoId == alumno.Id);

            string estatusFinanciero = mensualidad != null ? mensualidad.EstadoActual : "Sin Recibo";

            // 3. Devolvemos la respuesta con la autorización y el estatus financiero
            return Ok(new
            {
                NombreCompleto = alumno.Nombre,
                Disciplinas = alumno.Disciplinas,
                EstatusFinanciero = estatusFinanciero,
                FechaHora = DateTime.Now.ToString("dd/MM/yyyy hh:mm tt"),
                PermitirAcceso = estatusFinanciero != "Vencido" // Deja pasar si está Pagado o Pendiente, pero advierte
            });
        }
    }
}