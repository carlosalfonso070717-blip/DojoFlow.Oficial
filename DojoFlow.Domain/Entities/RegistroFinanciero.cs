using System.ComponentModel.DataAnnotations.Schema;

namespace DojoFlow.Domain.Entities
{
    public class RegistroFinanciero
    {
        public int Id { get; set; }
        public string MesAnio { get; set; } = string.Empty; // Ejemplo: "06-2026"
        public decimal IngresosMensualidades { get; set; }
        public decimal IngresosVentas { get; set; }
        public int VentasRealizadas { get; set; }

        [NotMapped]
        public decimal Total => IngresosMensualidades + IngresosVentas;
    }
}
