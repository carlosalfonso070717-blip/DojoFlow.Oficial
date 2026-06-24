using System;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Domain.States
{
    // 1. La interfaz base que todos los estados deben respetar
    public interface IEstadoMensualidad
    {
        string NombreEstado { get; }
        void ProcesarPago(Mensualidad mensualidad);
        void Vencer(Mensualidad mensualidad);
    }

    // 2. Estado: Pendiente
    public class EstadoPendiente : IEstadoMensualidad
    {
        public string NombreEstado => "Pendiente";

        public void ProcesarPago(Mensualidad mensualidad)
        {
            // El pago se acepta y evoluciona a Pagado
            mensualidad.CambiarEstado(new EstadoPagado());
        }

        public void Vencer(Mensualidad mensualidad)
        {
            // Pasa el tiempo, evoluciona a Vencido
            mensualidad.CambiarEstado(new EstadoVencido());
        }
    }

    // 3. Estado: Pagado
    public class EstadoPagado : IEstadoMensualidad
    {
        public string NombreEstado => "Pagado";

        public void ProcesarPago(Mensualidad mensualidad)
        {
            throw new InvalidOperationException("Alerta: Esta mensualidad ya fue pagada. Movimiento rechazado.");
        }

        public void Vencer(Mensualidad mensualidad)
        {
            throw new InvalidOperationException("Una mensualidad ya cubierta no puede vencer.");
        }
    }

    // 4. Estado: Vencido
    public class EstadoVencido : IEstadoMensualidad
    {
        public string NombreEstado => "Vencido";

        public void ProcesarPago(Mensualidad mensualidad)
        {
            // Se cobra y se regulariza la deuda
            mensualidad.CambiarEstado(new EstadoPagado());
        }

        public void Vencer(Mensualidad mensualidad)
        {
            throw new InvalidOperationException("Esta mensualidad ya se encontraba vencida.");
        }
    }
}