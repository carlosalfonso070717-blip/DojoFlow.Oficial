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

        private string _estadoActual = string.Empty;

        // Propiedad para mandar al Frontend y persistir en la BD.
        // El setter también reconstruye el motor de Patrón State (_estado), porque
        // EF Core rehidrata las entidades asignando propiedades directamente (sin pasar
        // por CambiarEstado), y sin esto _estado quedaba null tras leer de la BD.
        public string EstadoActual
        {
            get => _estadoActual;
            set
            {
                _estadoActual = value;
                _estado = CrearEstadoDesde(value);
            }
        }

        // El motor del Patrón State
        private IEstadoMensualidad _estado;

        private static IEstadoMensualidad CrearEstadoDesde(string nombreEstado) => nombreEstado switch
        {
            "Pagado" => new EstadoPagado(),
            "Vencido" => new EstadoVencido(),
            _ => new EstadoPendiente()
        };

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
            _estadoActual = nuevoEstado.NombreEstado;
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