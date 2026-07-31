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
            EstadoActual = nuevoEstado.NombreEstado;
        }

        // --- MÉTODOS DEL NEGOCIO ---

        public void Pagar()
        {
            // Delegamos la validación lógica al Estado Actual.
            // El estado se reconstruye siempre desde EstadoActual (en vez de cachearse
            // en un campo aparte) porque EF Core, al leer de la BD, escribe directo al
            // campo privado por convención y no pasa por ningún setter con lógica.
            ObtenerEstado().ProcesarPago(this);
            FechaPago = DateTime.UtcNow;
        }

        public void MarcarComoVencida()
        {
            ObtenerEstado().Vencer(this);
        }

        private IEstadoMensualidad ObtenerEstado() => EstadoActual switch
        {
            "Pagado" => new EstadoPagado(),
            "Vencido" => new EstadoVencido(),
            _ => new EstadoPendiente()
        };
    }
}
