using System;

namespace DojoFlow.Domain.Entities
{
    public enum TipoTransaccion
    {
        Cuota,
        Venta
    }

    // Cada ingreso individual (un cobro de mensualidad o una venta de inventario).
    // RegistroFinanciero guarda los totales del mes; esto guarda el detalle para los reportes.
    public class Transaccion : IPerteneceAAcademia
    {
        public Guid Id { get; set; }
        public Guid AcademiaId { get; set; }
        public DateTime Fecha { get; set; }
        // Mismo formato que RegistroFinanciero ("10-2026") para agrupar por mes
        public string MesAnio { get; set; } = string.Empty;
        public TipoTransaccion Tipo { get; set; }
        public string Concepto { get; set; } = string.Empty;
        public int Cantidad { get; set; } = 1;
        public decimal Monto { get; set; }
    }
}
