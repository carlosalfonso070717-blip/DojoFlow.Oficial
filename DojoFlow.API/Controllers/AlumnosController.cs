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

        // Swagger interpretará esto automáticamente como un arreglo de textos
        public List<string> Disciplinas { get; set; } = new();
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AlumnosController : ControllerBase
    {
        private readonly RegistrarAlumnoUseCase _registrarAlumnoUseCase;

        public AlumnosController(RegistrarAlumnoUseCase registrarAlumnoUseCase)
        {
            _registrarAlumnoUseCase = registrarAlumnoUseCase;
        }

        [HttpGet]
        public IActionResult GetAlumnos()
        {
            var alumnos = new[] {
                new { Id = Guid.NewGuid(), Nombre = "Carlos", Apellido = "Llanes", Telefono = "9991234567", Disciplinas = new[] { "MMA", "JiuJitsu" }, Estatus = "Activo", Mensualidad = 1500.00m },
                new { Id = Guid.NewGuid(), Nombre = "Alex", Apellido = "Pereira", Telefono = "9997654321", Disciplinas = new[] { "Kickboxing" }, Estatus = "Activo", Mensualidad = 850.00m }
            };
            return Ok(alumnos);
        }

        [HttpPost]
        public IActionResult RegistrarAlumno([FromBody] RegistrarAlumnoRequest request)
        {
            try
            {
                // 1. Usamos el Builder pasando el arreglo de disciplinas contratadas
                Alumno nuevoAlumno = new Alumno.Builder()
                    .ConNombre(request.Nombre)
                    .ConApellido(request.Apellido)
                    .ConTelefono(request.Telefono)
                    .ConDisciplinas(request.Disciplinas)
                    .Build();

                // 2. El Strategy calcula el precio basado en cuántas disciplinas se agregaron
                var calculadora = new CalculadoraMensualidad(nuevoAlumno.Disciplinas.Count);
                decimal costoMensualidad = calculadora.ObtenerCostoMensual();

                return StatusCode(201, new
                {
                    Mensaje = $"¡El peleador {nuevoAlumno.Nombre} fue registrado correctamente con un plan de {nuevoAlumno.Disciplinas.Count} disciplina(s)!",
                    IdAsignado = nuevoAlumno.Id,
                    NombreCompleto = $"{nuevoAlumno.Nombre} {nuevoAlumno.Apellido}",
                    DisciplinasInscritas = nuevoAlumno.Disciplinas,
                    CostoMensualidadAsignado = $"${costoMensualidad} MXN",
                    FechaIngreso = nuevoAlumno.FechaInscripcion
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}