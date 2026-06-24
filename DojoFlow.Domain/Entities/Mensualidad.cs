using System;
using DojoFlow.Domain.States;

namespace DojoFlow.Domain.Entities
{
    public class Mensualidad
    {
        public Guid Id { get; private set; }
        public Guid AlumnoId { get; private set; }
        public decimal Monto { get; private set; }
        public DateTime FechaGeneracion { get; private set; }
        public DateTime FechaVencimiento { get; private set; }
        public DateTime? FechaPago { get; private set; }

        // Propiedad de solo lectura para mandar al Frontend y la BD
        public string EstadoActual { get; private set; }

        // El motor del Patrón State
        private IEstadoMensualidad _estado;

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