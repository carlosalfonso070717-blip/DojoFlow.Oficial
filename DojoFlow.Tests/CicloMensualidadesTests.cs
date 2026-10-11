using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Services;
using System;
using System.Collections.Generic;

namespace DojoFlow.Tests
{
    public class CicloMensualidadesTests
    {
        private static readonly Guid Academia = Guid.NewGuid();

        private static Alumno NuevoAlumno() => new()
        {
            Id = Guid.NewGuid(),
            AcademiaId = Academia,
            Activo = true,
            CostoMensualidad = 850m
        };

        private static Mensualidad Recibo(Alumno alumno, DateTime vence, string estado = "Pendiente")
        {
            var recibo = new Mensualidad(alumno.Id, alumno.CostoMensualidad, vence) { AcademiaId = Academia };
            if (estado == "Pagado") recibo.Pagar();
            if (estado == "Vencido") recibo.MarcarComoVencida();
            return recibo;
        }

        [Fact]
        public void ReciboPendiente_DespuesDeSuFecha_SeVuelveVencido()
        {
            var alumno = NuevoAlumno();
            var recibo = Recibo(alumno, new DateTime(2026, 10, 15));

            var resultado = CicloMensualidades.Aplicar(alumno, new[] { recibo }, new DateTime(2026, 10, 16));

            Assert.Equal("Vencido", recibo.EstadoActual);
            Assert.Single(resultado.Vencidas);
            Assert.Null(resultado.Nueva);
        }

        [Fact]
        public void ReciboPendiente_ElMismoDiaQueVence_SigueSiendoPendiente()
        {
            var alumno = NuevoAlumno();
            var recibo = Recibo(alumno, new DateTime(2026, 10, 15));

            CicloMensualidades.Aplicar(alumno, new[] { recibo }, new DateTime(2026, 10, 15, 21, 0, 0));

            Assert.Equal("Pendiente", recibo.EstadoActual);
        }

        [Fact]
        public void ReciboPagado_NoGeneraElSiguienteAntesDelAviso()
        {
            var alumno = NuevoAlumno();
            var pagado = Recibo(alumno, new DateTime(2026, 10, 15), "Pagado");

            // El de noviembre vence el 15; el aviso empieza el 8
            var resultado = CicloMensualidades.Aplicar(alumno, new[] { pagado }, new DateTime(2026, 11, 7));

            Assert.Null(resultado.Nueva);
        }

        [Fact]
        public void ReciboPagado_GeneraElDelMesSiguienteComoPendiente()
        {
            var alumno = NuevoAlumno();
            var pagado = Recibo(alumno, new DateTime(2026, 10, 15), "Pagado");

            var resultado = CicloMensualidades.Aplicar(alumno, new[] { pagado }, new DateTime(2026, 11, 8));

            Assert.NotNull(resultado.Nueva);
            Assert.Equal(new DateTime(2026, 11, 15), resultado.Nueva!.FechaVencimiento.Date);
            Assert.Equal("Pendiente", resultado.Nueva.EstadoActual);
            Assert.Equal(850m, resultado.Nueva.Monto);
            Assert.Equal(Academia, resultado.Nueva.AcademiaId);
        }

        [Fact]
        public void PagoTardio_ElSiguienteYaVencidoNaceVencido()
        {
            var alumno = NuevoAlumno();
            // Pagó el de octubre hasta diciembre: el de noviembre ya venció
            var pagado = Recibo(alumno, new DateTime(2026, 10, 15), "Pagado");

            var resultado = CicloMensualidades.Aplicar(alumno, new[] { pagado }, new DateTime(2026, 12, 2));

            Assert.Equal(new DateTime(2026, 11, 15), resultado.Nueva!.FechaVencimiento.Date);
            Assert.Equal("Vencido", resultado.Nueva.EstadoActual);
        }

        [Fact]
        public void ReciboSinPagar_NoAcumulaMasRecibos()
        {
            var alumno = NuevoAlumno();
            var debe = Recibo(alumno, new DateTime(2026, 6, 15), "Vencido");

            var resultado = CicloMensualidades.Aplicar(alumno, new[] { debe }, new DateTime(2026, 10, 11));

            Assert.Null(resultado.Nueva);
        }

        [Fact]
        public void AplicarDosVeces_NoDuplicaElRecibo()
        {
            var alumno = NuevoAlumno();
            var recibos = new List<Mensualidad> { Recibo(alumno, new DateTime(2026, 10, 15), "Pagado") };
            var hoy = new DateTime(2026, 11, 10);

            recibos.Add(CicloMensualidades.Aplicar(alumno, recibos, hoy).Nueva!);
            var segunda = CicloMensualidades.Aplicar(alumno, recibos, hoy);

            Assert.Null(segunda.Nueva);
        }

        [Fact]
        public void AlumnoInactivo_NoGeneraRecibos()
        {
            var alumno = NuevoAlumno();
            alumno.Desactivar();
            var pagado = Recibo(alumno, new DateTime(2026, 10, 15), "Pagado");

            Assert.Null(CicloMensualidades.Aplicar(alumno, new[] { pagado }, new DateTime(2026, 11, 14)).Nueva);
        }

        [Fact]
        public void FinDeMes_RespetaMesesCortos()
        {
            var alumno = NuevoAlumno();
            var pagado = Recibo(alumno, new DateTime(2026, 1, 31), "Pagado");

            var nueva = CicloMensualidades.Aplicar(alumno, new[] { pagado }, new DateTime(2026, 2, 25)).Nueva;

            Assert.Equal(new DateTime(2026, 2, 28), nueva!.FechaVencimiento.Date);
        }

        [Theory]
        [InlineData(new[] { "Pagado", "Pendiente" }, "Pendiente")]
        [InlineData(new[] { "Vencido", "Pagado" }, "Vencido")]
        [InlineData(new[] { "Pagado" }, "Pagado")]
        [InlineData(new string[0], "Sin Recibo")]
        public void EstatusActual_SiDebeAlgoEsVencido(string[] estados, string esperado)
        {
            var alumno = NuevoAlumno();
            var recibos = new List<Mensualidad>();
            for (int i = 0; i < estados.Length; i++)
                recibos.Add(Recibo(alumno, new DateTime(2026, 8 + i, 15), estados[i]));

            Assert.Equal(esperado, CicloMensualidades.EstatusActual(recibos));
        }
    }
}
