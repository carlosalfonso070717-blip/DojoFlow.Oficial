using System;

namespace DojoFlow.Domain.Entities
{
    public class Transaccion
    {
        public int Id { get; set; }
        public string Concepto { get; set; } // Ej: "Venta de Guantes", "Pago de Mensualidad"
        public decimal Monto { get; set; }
        public DateTime Fecha { get; set; }
        public string Tipo { get; set; } // "Ingreso" o "Egreso"
    }
}