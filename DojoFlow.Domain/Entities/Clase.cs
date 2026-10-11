using System;

namespace DojoFlow.Domain.Entities
{
    // Lo que la academia enseña: MMA, Ballet, Hip Hop, Piano...
    // (antes eran las "disciplinas" fijas de Dominio Combat Club)
    public class Clase : IPerteneceAAcademia
    {
        public Guid Id { get; set; }
        public Guid AcademiaId { get; set; }
        public string Nombre { get; set; } = string.Empty;
        // Se usa cuando la academia cobra en modo PorClase
        public decimal Precio { get; set; }
        public bool Activa { get; set; } = true;

        public Clase() { }

        public Clase(string nombre, decimal precio)
        {
            if (string.IsNullOrWhiteSpace(nombre))
                throw new ArgumentException("El nombre de la clase es obligatorio.");
            if (precio < 0)
                throw new ArgumentException("El precio no puede ser negativo.");

            Id = Guid.NewGuid();
            Nombre = nombre.Trim();
            Precio = precio;
        }
    }
}
