using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Observers;
using DojoFlow.Domain.Strategies;
using System;
using System.Collections.Generic;

namespace DojoFlow.Tests
{
    public class CalculadoraMensualidadTests
    {
        private static Academia AcademiaPaquete() => new()
        {
            ModoCobro = ModoCobro.Paquete,
            // Precios que usaba Dominio Combat Club antes de ser configurables
            PreciosPaquete = new List<decimal> { 850m, 1500m, 2400m, 3200m, 4000m }
        };

        private static List<Clase> Clases(params decimal[] precios)
        {
            var clases = new List<Clase>();
            foreach (var precio in precios) clases.Add(new Clase($"Clase {clases.Count}", precio));
            return clases;
        }

        [Theory]
        [InlineData(1, 850)]
        [InlineData(2, 1500)]
        [InlineData(3, 2400)]
        [InlineData(5, 4000)]
        public void Paquete_CobraElComboSegunCantidadDeClases(int cantidad, decimal esperado)
        {
            var clases = Clases(new decimal[cantidad]);
            var costo = new CalculadoraMensualidad(AcademiaPaquete(), clases).ObtenerCostoMensual();
            Assert.Equal(esperado, costo);
        }

        [Fact]
        public void Paquete_ConMasClasesQuePaquetes_UsaElPaqueteMasGrande()
        {
            var costo = new CalculadoraMensualidad(AcademiaPaquete(), Clases(new decimal[7])).ObtenerCostoMensual();
            Assert.Equal(4000m, costo);
        }

        [Fact]
        public void PorClase_SumaElPrecioDeCadaClase()
        {
            var academia = new Academia { ModoCobro = ModoCobro.PorClase };
            var costo = new CalculadoraMensualidad(academia, Clases(700m, 500m)).ObtenerCostoMensual();
            Assert.Equal(1200m, costo);
        }
    }

    public class AcademiaTests
    {
        [Theory]
        [InlineData("#d90429", true)]
        [InlineData("#ABCDEF", true)]
        [InlineData("rojo", false)]
        [InlineData("#fff", false)]
        [InlineData(null, false)]
        public void ValidaColoresHexadecimales(string? color, bool esValido)
        {
            Assert.Equal(esValido, Academia.EsColorValido(color));
        }

        [Fact]
        public void ActualizarMarca_ConColorInvalido_Lanza()
        {
            var academia = new Academia();
            Assert.Throws<ArgumentException>(() => academia.ActualizarMarca("Swan", "rosa", "#000000", "Bailarina"));
        }

        [Fact]
        public void ConfigurarCobro_PaqueteSinPrecios_Lanza()
        {
            var academia = new Academia();
            Assert.Throws<ArgumentException>(() => academia.ConfigurarCobro(ModoCobro.Paquete, new List<decimal>(), 15));
        }

        [Fact]
        public void CambiarLogo_IncrementaVersionParaInvalidarCache()
        {
            var academia = new Academia();
            academia.CambiarLogo(new byte[] { 1 }, "image/png");
            academia.CambiarLogo(new byte[] { 2 }, "image/png");
            Assert.Equal(2, academia.LogoVersion);
        }

        [Theory]
        [InlineData(10, 15, 2026, 10)] // antes del día 15: vence este mes
        [InlineData(20, 15, 2026, 11)] // después del día 15: vence el siguiente
        public void PrimerVencimiento_RespetaElDiaConfigurado(int diaHoy, int diaVencimiento, int anioEsperado, int mesEsperado)
        {
            var academia = new Academia { DiaVencimiento = diaVencimiento };
            var vencimiento = academia.CalcularPrimerVencimiento(new DateTime(2026, 10, diaHoy));
            Assert.Equal(new DateTime(anioEsperado, mesEsperado, diaVencimiento), vencimiento.Date);
        }

        [Fact]
        public void Plantillas_TipoDesconocido_UsaOtro()
        {
            Assert.Equal(PlantillasAcademia.Otro, PlantillasAcademia.Para("Astronautas").TipoNegocio);
        }
    }

    public class AlertaStockObserverTests
    {
        [Fact]
        public void AlertasDeUnaAcademia_NoSeVenEnOtra()
        {
            var academiaA = Guid.NewGuid();
            var academiaB = Guid.NewGuid();
            var producto = new Producto(Guid.NewGuid(), "Zapatillas de punta", 3, 2) { AcademiaId = academiaA };
            producto.Suscribir(new AlertaStockObserver());

            producto.ReducirStock(2);

            Assert.Single(AlertaStockObserver.ObtenerAlertas(academiaA));
            Assert.Empty(AlertaStockObserver.ObtenerAlertas(academiaB));
        }

        [Fact]
        public void UnaSolaAlertaVigentePorProducto()
        {
            var academia = Guid.NewGuid();
            var producto = new Producto(Guid.NewGuid(), "Leotardos", 5, 4) { AcademiaId = academia };
            producto.Suscribir(new AlertaStockObserver());

            producto.ReducirStock(1);
            producto.ReducirStock(1);

            Assert.Single(AlertaStockObserver.ObtenerAlertas(academia));
        }
    }
}
