using DojoFlow.Domain.Entities;
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
            if (!EsPinValido(pin, out int pinNum))
            {
                return BadRequest(new { Error = "El PIN debe ser un número exacto de 5 dígitos." });
            }

           
            var alumno = BuscarAlumnoPorPin(pinNum);
            if (alumno == null)
            {
                return NotFound(new { Error = "PIN incorrecto o peleador no registrado." });
            }

         
            string estatusFinanciero = ObtenerEstatusFinanciero(alumno.Id);

      
            var respuesta = ConstruirRespuestaDeAcceso(alumno, estatusFinanciero);
            return Ok(respuesta);
        }

        private bool EsPinValido(string pin, out int pinNum)
        {
            pinNum = 0;
            return !string.IsNullOrWhiteSpace(pin) &&
                   pin.Length == 5 &&
                   int.TryParse(pin, out pinNum);
        }

        private AlumnoVista BuscarAlumnoPorPin(int pinNum)
        {
   
            var lista = AlumnosController._baseDeDatosEnMemoria;

            System.Diagnostics.Debug.WriteLine($"Buscando PIN: {pinNum} en una lista de {lista.Count} alumnos.");

            return lista.FirstOrDefault(a => a.ClaveKiosco == pinNum);
        }

        private string ObtenerEstatusFinanciero(Guid alumnoId)
        {
            var mensualidad = MensualidadesController._tablaMensualidades
                .FirstOrDefault(m => m.AlumnoId == alumnoId);

            return mensualidad != null ? mensualidad.EstadoActual : "Sin Recibo";
        }

        private object ConstruirRespuestaDeAcceso(dynamic alumno, string estatusFinanciero)
        {
            bool permitirAcceso = estatusFinanciero != "Vencido";

            return new
            {
                NombreCompleto = alumno.Nombre,
                Disciplinas = alumno.Disciplinas,
                EstatusFinanciero = estatusFinanciero,
                FechaHora = DateTime.Now.ToString("dd/MM/yyyy hh:mm tt"),
                PermitirAcceso = permitirAcceso
            };
        }
    }
}