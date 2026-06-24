using Microsoft.AspNetCore.Mvc;
using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Strategies;
using System;
using System.Collections.Generic;
using System.Linq;

namespace DojoFlow.API.Controllers
{
    public class RegistrarAlumnoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public List<string> Disciplinas { get; set; } = new();
    }

    public class AlumnoVista
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public List<string> Disciplinas { get; set; } = new();
        public decimal CostoMensualidad { get; set; }
        public int ClaveKiosco { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AlumnosController : ControllerBase
    {
        //  AHORA ES UNA LISTA FUERTE USANDO LA CLASE AlumnoVista
        public static readonly List<AlumnoVista> _baseDeDatosEnMemoria = new List<AlumnoVista>
        {
            new AlumnoVista { Id = Guid.Parse("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"), Nombre = "Carlos Llanes", Telefono = "9991234567", Disciplinas = new List<string>{ "MMA", "JiuJitsu" }, CostoMensualidad = 1500.00m, ClaveKiosco = 12345 },
            new AlumnoVista { Id = Guid.NewGuid(), Nombre = "María Sosa", Telefono = "9999876543", Disciplinas = new List<string>{ "Boxeo" }, CostoMensualidad = 850.00m, ClaveKiosco = 98765 }
        };

        [HttpGet]
        public IActionResult GetAlumnos()
        {
            return Ok(_baseDeDatosEnMemoria);
        }

        [HttpPost]
        public IActionResult RegistrarAlumno([FromBody] RegistrarAlumnoRequest request)
        {
            try
            {
                Alumno nuevoAlumno = new Alumno.Builder()
                    .ConNombre(request.Nombre)
                    .ConApellido(request.Apellido)
                    .ConTelefono(request.Telefono)
                    .ConDisciplinas(request.Disciplinas)
                    .Build();

                var calculadora = new CalculadoraMensualidad(nuevoAlumno.Disciplinas.Count);
                decimal costoMensualidad = calculadora.ObtenerCostoMensual();

                // Guardamos usando la nueva estructura segura
                var alumnoParaTabla = new AlumnoVista
                {
                    Id = nuevoAlumno.Id,
                    Nombre = $"{nuevoAlumno.Nombre} {nuevoAlumno.Apellido}",
                    Telefono = nuevoAlumno.Telefono,
                    Disciplinas = nuevoAlumno.Disciplinas,
                    CostoMensualidad = costoMensualidad,
                    ClaveKiosco = nuevoAlumno.ClaveKiosco
                };

                _baseDeDatosEnMemoria.Add(alumnoParaTabla);

                DateTime hoy = DateTime.UtcNow;
                DateTime fechaVencimiento = new DateTime(hoy.Year, hoy.Month, 15);
                if (hoy.Day > 15) fechaVencimiento = fechaVencimiento.AddMonths(1);

                var primeraMensualidad = new Mensualidad(nuevoAlumno.Id, costoMensualidad, fechaVencimiento);
                MensualidadesController._tablaMensualidades.Add(primeraMensualidad);

                return StatusCode(201, new
                {
                    Mensaje = $"¡Registro exitoso! Su PIN de acceso es: {nuevoAlumno.ClaveKiosco}",
                    IdAsignado = nuevoAlumno.Id,
                    NombreCompleto = $"{nuevoAlumno.Nombre} {nuevoAlumno.Apellido}",
                    ClaveKioscoAsignada = nuevoAlumno.ClaveKiosco,
                    DisciplinasInscritas = nuevoAlumno.Disciplinas,
                    CostoMensualidadAsignado = $"${costoMensualidad} MXN"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult EliminarAlumno(Guid id)
        {
            // AL ESTAR ESTRUCTURADO, C# YA NO CHOCA AL BUSCAR EL ID
            var alumno = _baseDeDatosEnMemoria.FirstOrDefault(a => a.Id == id);

            if (alumno == null)
                return NotFound(new { Error = "Peleador no encontrado en el sistema." });

            _baseDeDatosEnMemoria.Remove(alumno);

            MensualidadesController._tablaMensualidades.RemoveAll(m => m.AlumnoId == id);

            return Ok(new { Mensaje = "El peleador y sus recibos han sido eliminados correctamente." });
        }
    }
}