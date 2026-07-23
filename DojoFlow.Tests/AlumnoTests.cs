using Xunit;
using DojoFlow.Domain.Entities;
using System;

namespace DojoFlow.Tests
{
    public class AlumnoTests
    {
        [Fact]
        public void CrearAlumno_ConDatosValidos_DeberiaAsignarValoresCorrectamente()
        {
            var idEsperado = Guid.NewGuid();
            var nombreEsperado = "Johnny";
            var apellidoEsperado = "Lawrence";

            var alumno = new Alumno 
            { 
                Id = idEsperado, 
                Nombre = nombreEsperado, 
                Apellido = apellidoEsperado 
            };

            Assert.Equal(idEsperado, alumno.Id);
            Assert.Equal(nombreEsperado, alumno.Nombre);
        }
    }
}