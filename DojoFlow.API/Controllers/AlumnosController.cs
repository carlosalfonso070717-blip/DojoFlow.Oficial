using Microsoft.AspNetCore.Mvc;
using DojoFlow.Application.UseCases.Alumnos;
using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Strategies;
using System;

namespace DojoFlow.API.Controllers
{
    // 1. ACTUALIZAMOS EL MOLDE para que coincida con las propiedades de tu entidad Alumno
    public class RegistrarAlumnoRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string Disciplina { get; set; } = string.Empty; // Ej. Kickboxing, MMA, Judo, Boxeo, JiuJitsu
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
            // Actualizamos la lista de prueba para que se vea más profesional con la nueva estructura
            var alumnos = new[] {
                new { Id = Guid.NewGuid(), Nombre = "Carlos", Apellido = "Llanes", Telefono = "9991234567", Disciplina = "MMA", Estatus = "Activo", Mensualidad = 800.00m },
                new { Id = Guid.NewGuid(), Nombre = "Alex", Apellido = "Pereira", Telefono = "9997654321", Disciplina = "Kickboxing", Estatus = "Activo", Mensualidad = 500.00m },
                new { Id = Guid.NewGuid(), Nombre = "Islam", Apellido = "Makhachev", Telefono = "9991112233", Disciplina = "Judo", Estatus = "Activo", Mensualidad = 600.00m }
            };

            return Ok(alumnos);
        }

        [HttpPost]
        public IActionResult RegistrarAlumno([FromBody] RegistrarAlumnoRequest request)
        {
            try
            {
                // 2. PATRÓN CREACIONAL (Builder): Armamos al alumno de forma segura
                Alumno nuevoAlumno = new Alumno.Builder()
                    .ConNombre(request.Nombre)
                    .ConApellido(request.Apellido)
                    .ConTelefono(request.Telefono)
                    .EnDisciplina(request.Disciplina)
                    .Build();

                // 3. PATRÓN DE COMPORTAMIENTO (Strategy): Calculamos su mensualidad según su disciplina
                var calculadora = new CalculadoraMensualidad(nuevoAlumno.Disciplina);
                decimal costoMensualidad = calculadora.ObtenerCostoMensual();

                // 4. Respondemos con todos los datos procesados (Perfecto para tu captura del PDF)
                return StatusCode(201, new
                {
                    Mensaje = $"¡El peleador {nuevoAlumno.Nombre} fue registrado correctamente en el tatami!",
                    IdAsignado = nuevoAlumno.Id,
                    NombreCompleto = $"{nuevoAlumno.Nombre} {nuevoAlumno.Apellido}",
                    DisciplinaInscrita = nuevoAlumno.Disciplina,
                    FechaIngreso = nuevoAlumno.FechaInscripcion,
                    EstatusInicial = nuevoAlumno.Activo ? "Activo" : "Inactivo",
                    CostoMensualidadAsignado = $"${costoMensualidad} MXN"
                });
            }
            catch (ArgumentException ex)
            {
                // Si el Builder detecta que falta el nombre o apellido, manda un error 400 (Bad Request)
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}