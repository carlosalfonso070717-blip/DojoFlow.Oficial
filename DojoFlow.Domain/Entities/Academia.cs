using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace DojoFlow.Domain.Entities
{
    public enum ModoCobro
    {
        // El precio depende de cuántas clases toma el alumno (combo de 1, 2, 3... clases)
        Paquete,
        // El precio es la suma del precio individual de cada clase
        PorClase
    }

    // El negocio que usa DojoFlow (academia de combate, ballet, danza, música, etc.)
    public class Academia
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string TipoNegocio { get; set; } = string.Empty;

        // Personalización visual
        public string ColorPrimario { get; set; } = "#d90429";
        public string ColorSecundario { get; set; } = "#111418";
        public byte[]? Logo { get; set; }
        public string? LogoContentType { get; set; }
        // Se incrementa con cada logo nuevo para invalidar la caché de los clientes
        public int LogoVersion { get; set; }

        // Cómo llama la academia a sus alumnos: "Alumno", "Peleador", "Bailarina"...
        public string TerminoAlumno { get; set; } = "Alumno";

        // Cobro
        public ModoCobro ModoCobro { get; set; } = ModoCobro.PorClase;
        // Precio del combo por número de clases: [0] = 1 clase, [1] = 2 clases, ...
        public List<decimal> PreciosPaquete { get; set; } = new();
        public string Moneda { get; set; } = "MXN";
        public int DiaVencimiento { get; set; } = 15;

        public DateTime FechaCreacion { get; set; }

        // Código del enlace público del catálogo (dojoflow.club/catalogo/{codigo}); null = no compartido
        public string? CodigoCatalogo { get; set; }

        private static readonly Regex ColorHex = new("^#[0-9a-fA-F]{6}$");

        public static bool EsColorValido(string? color) => color != null && ColorHex.IsMatch(color);

        public void ActualizarMarca(string nombre, string colorPrimario, string colorSecundario, string terminoAlumno)
        {
            if (string.IsNullOrWhiteSpace(nombre))
                throw new ArgumentException("El nombre de la academia es obligatorio.");
            if (!EsColorValido(colorPrimario) || !EsColorValido(colorSecundario))
                throw new ArgumentException("Los colores deben tener formato hexadecimal, por ejemplo #d90429.");

            Nombre = nombre.Trim();
            ColorPrimario = colorPrimario.ToLowerInvariant();
            ColorSecundario = colorSecundario.ToLowerInvariant();
            TerminoAlumno = string.IsNullOrWhiteSpace(terminoAlumno) ? "Alumno" : terminoAlumno.Trim();
        }

        public void ConfigurarCobro(ModoCobro modo, List<decimal> preciosPaquete, int diaVencimiento)
        {
            if (preciosPaquete.Exists(p => p < 0))
                throw new ArgumentException("Los precios no pueden ser negativos.");
            if (modo == ModoCobro.Paquete && preciosPaquete.Count == 0)
                throw new ArgumentException("El cobro por paquete necesita al menos un precio.");
            if (diaVencimiento < 1 || diaVencimiento > 28)
                throw new ArgumentException("El día de vencimiento debe estar entre 1 y 28.");

            ModoCobro = modo;
            PreciosPaquete = preciosPaquete;
            DiaVencimiento = diaVencimiento;
        }

        public void CambiarLogo(byte[] logo, string contentType)
        {
            Logo = logo;
            LogoContentType = contentType;
            LogoVersion++;
        }

        public void QuitarLogo()
        {
            Logo = null;
            LogoContentType = null;
            LogoVersion++;
        }

        // Genera un código nuevo; el anterior deja de funcionar
        public string RenovarCodigoCatalogo()
        {
            // Sin letras ni números que se confundan al leerlos (0/o, 1/l/i)
            const string alfabeto = "abcdefghjkmnpqrstuvwxyz23456789";
            var bytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(10);
            CodigoCatalogo = new string(bytes.Select(b => alfabeto[b % alfabeto.Length]).ToArray());
            return CodigoCatalogo;
        }

        // Fecha del primer recibo: el día de vencimiento de este mes, o del siguiente si ya pasó
        public DateTime CalcularPrimerVencimiento(DateTime hoy)
        {
            var vencimiento = new DateTime(hoy.Year, hoy.Month, DiaVencimiento, 0, 0, 0, DateTimeKind.Utc);
            return hoy.Day > DiaVencimiento ? vencimiento.AddMonths(1) : vencimiento;
        }
    }
}
