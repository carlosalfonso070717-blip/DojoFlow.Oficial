using System;
using DojoFlow.Domain.States;

namespace DojoFlow.Domain.Entities
{
    public class Mensualidad
    {
        public Guid Id { get; set; }
        public Guid AlumnoId { get; set; }
        public decimal Monto { get; set; }
        public DateTime FechaGeneracion { get; set; }
        public DateTime FechaVencimiento { get; set; }
        public DateTime? FechaPago { get; set; }

        // Propiedad de solo lectura para mandar al Frontend y la BD
        public string EstadoActual { get; set; } = string.Empty;

        // El motor del Patrón State
        private IEstadoMensualidad _estado;

        public Mensualidad() { }

        public Mensualidad(Guid alumnoId, decimal monto, DateTime fechaVencimiento)
        {
            Id = Guid.NewGuid();
            AlumnoId = alumnoId;
            Monto = monto;
            FechaGeneracion = DateTime.UtcNow;
            FechaVencimiento = fechaVencimiento;

            // Toda mensualidad nace con deuda (Pendiente)
            CambiarEstado(new EstadoPendiente());
        }

        // Método interno que usan las clases State para transicionar
        public void CambiarEstado(IEstadoMensualidad nuevoEstado)
        {
            _estado = nuevoEstado;
            EstadoActual = nuevoEstado.NombreEstado;
        }

        // --- MÉTODOS DEL NEGOCIO ---

        public void Pagar()
        {
            // Delegamos la validación lógica al Estado Actual
            _estado.ProcesarPago(this);
            FechaPago = DateTime.UtcNow;
        }

        public void MarcarComoVencida()
        {
            _estado.Vencer(this);
        }
    }
}