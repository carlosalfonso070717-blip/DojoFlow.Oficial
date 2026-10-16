using DojoFlow.Domain.Entities;
using System;
using System.Collections.Generic;

namespace DojoFlow.Tests
{
    public class SucursalesTests
    {
        private static Academia Principal()
        {
            var academia = new Academia
            {
                Id = Guid.NewGuid(),
                TipoNegocio = "Danza",
                ModoCobro = ModoCobro.Paquete,
                PreciosPaquete = new List<decimal> { 700m, 1200m },
                DiaVencimiento = 10,
                AsistenciasActivas = true
            };
            academia.ActualizarMarca("Swan", "#ff5a8a", "#1d1d1f", "Bailarina");
            academia.CambiarLogo(new byte[] { 1, 2, 3 }, "image/png");
            return academia;
        }

        [Fact]
        public void CrearSucursal_HeredaMarcaYCobro_YApuntaALaPrincipal()
        {
            var principal = Principal();
            var norte = principal.CrearSucursal("Norte", "Av. Juárez 10", "555 123 4567", DateTime.UtcNow);

            Assert.NotEqual(principal.Id, norte.Id);
            Assert.Equal(principal.Id, norte.MatrizId);
            Assert.Equal(principal.Id, norte.GrupoId);
            Assert.Equal("Norte", norte.NombreSucursal);
            Assert.Equal("Av. Juárez 10", norte.Direccion);
            Assert.Equal(principal.Nombre, norte.Nombre);
            Assert.Equal(principal.ColorPrimario, norte.ColorPrimario);
            Assert.Equal(principal.TerminoAlumno, norte.TerminoAlumno);
            Assert.Equal(principal.Logo, norte.Logo);
            Assert.Equal(ModoCobro.Paquete, norte.ModoCobro);
            Assert.Equal(principal.PreciosPaquete, norte.PreciosPaquete);
            Assert.True(norte.AsistenciasActivas);
            Assert.True(norte.SucursalesActivas);
            // El catálogo compartible es de cada sede: la nueva empieza sin enlace
            Assert.Null(norte.CodigoCatalogo);
        }

        [Fact]
        public void CrearSucursal_DesdeOtraSucursal_SigueEnElMismoGrupo()
        {
            var principal = Principal();
            var norte = principal.CrearSucursal("Norte", null, null, DateTime.UtcNow);
            var sur = norte.CrearSucursal("Sur", null, null, DateTime.UtcNow);

            Assert.Equal(principal.Id, sur.MatrizId);
        }

        [Fact]
        public void CrearSucursal_NoCompartePreciosConLaPrincipal()
        {
            var principal = Principal();
            var norte = principal.CrearSucursal("Norte", null, null, DateTime.UtcNow);

            norte.ConfigurarCobro(ModoCobro.Paquete, new List<decimal> { 900m }, 5);

            Assert.Equal(new List<decimal> { 700m, 1200m }, principal.PreciosPaquete);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public void ActualizarDatosSucursal_SinNombre_Lanza(string nombre)
        {
            Assert.Throws<ArgumentException>(() => Principal().ActualizarDatosSucursal(nombre, null, null));
        }

        [Fact]
        public void ActualizarDatosSucursal_DatosVaciosQuedanNulos()
        {
            var academia = Principal();
            academia.ActualizarDatosSucursal("  Centro ", "  ", "");

            Assert.Equal("Centro", academia.NombreSucursal);
            Assert.Null(academia.Direccion);
            Assert.Null(academia.Telefono);
        }

        [Fact]
        public void CopiarLogoDe_SubeLaVersionParaInvalidarCache()
        {
            var principal = Principal();
            var norte = principal.CrearSucursal("Norte", null, null, DateTime.UtcNow);
            var version = norte.LogoVersion;

            principal.QuitarLogo();
            norte.CopiarLogoDe(principal);

            Assert.Null(norte.Logo);
            Assert.True(norte.LogoVersion > version);
        }
    }
}
