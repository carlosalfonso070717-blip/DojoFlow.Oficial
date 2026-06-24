using Microsoft.AspNetCore.Mvc;
using DojoFlow.Application.UseCases.Alumnos;
using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Strategies;
using System;
using System.Collections.Generic;

namespace DojoFlow.API.Controllers
{
    public class RegistrarAlumnoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public List<string> Disciplinas { get; set; } = new();
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AlumnosController : ControllerBase
    {
        // 🔥 BASE DE DATOS EN MEMORIA RESTAURADA 🔥
        private static readonly List<object> _baseDeDatosEnMemoria = new List<object>
        {
            new { Id = Guid.NewGuid(), Nombre = "Carlos Llanes", Telefono = "9991234567", Disciplinas = new[] { "MMA", "JiuJitsu" }, CostoMensualidad = 1500.00m },
            new { Id = Guid.NewGuid(), Nombre = "María Sosa", Telefono = "9999876543", Disciplinas = new[] { "Boxeo" }, CostoMensualidad = 850.00m }
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
                // 1. Instancia segura con el Builder
                Alumno nuevoAlumno = new Alumno.Builder()
                    .ConNombre(request.Nombre)
                    .ConApellido(request.Apellido)
                    .ConTelefono(request.Telefono)
                    .ConDisciplinas(request.Disciplinas)
                    .Build();

                // 2. Cálculo dinámico con el Strategy
                var calculadora = new CalculadoraMensualidad(nuevoAlumno.Disciplinas.Count);
                decimal costoMensualidad = calculadora.ObtenerCostoMensual();

                // 3. Guardado en la lista en memoria
                var alumnoParaTabla = new
                {
                    Id = nuevoAlumno.Id,
                    Nombre = $"{nuevoAlumno.Nombre} {nuevoAlumno.Apellido}",
                    Telefono = nuevoAlumno.Telefono,
                    Disciplinas = nuevoAlumno.Disciplinas,
                    CostoMensualidad = costoMensualidad
                };

                _baseDeDatosEnMemoria.Add(alumnoParaTabla);

                return StatusCode(201, new
                {
                    Mensaje = $"¡El peleador {nuevoAlumno.Nombre} fue registrado correctamente!",
                    IdAsignado = nuevoAlumno.Id,
                    NombreCompleto = $"{nuevoAlumno.Nombre} {nuevoAlumno.Apellido}",
                    DisciplinasInscritas = nuevoAlumno.Disciplinas,
                    CostoMensualidadAsignado = $"${costoMensualidad} MXN"
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}