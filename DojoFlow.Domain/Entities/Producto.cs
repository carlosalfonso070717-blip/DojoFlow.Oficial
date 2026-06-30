// Ubicación: DojoFlow.Domain/Entities/Producto.cs
using System;
using System.Collections.Generic;
using DojoFlow.Domain.Observers;

namespace DojoFlow.Domain.Entities
{
    public class Producto
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; }
        public int StockActual { get; set; }
        public int StockMinimo { get; set; }

        // La lista oculta de vigías (Observer Pattern)
        private readonly List<INotificadorInventario> _observadores = new();

        public Producto() { }

        public Producto(Guid id, string nombre, int stockInicial, int stockMinimo)
        {
            Id = id;
            Nombre = nombre;
            StockActual = stockInicial;
            StockMinimo = stockMinimo;
        }

        // Suscribir a un vigía
        public void Suscribir(INotificadorInventario observador) => _observadores.Add(observador);

        // Método para restar stock tras una venta o préstamo
        public void ReducirStock(int cantidad)
        {
            StockActual -= cantidad;
            if (StockActual < 0) StockActual = 0;

            // 🔥 MAGIA DEL OBSERVER: Si el stock toca el mínimo, grita la alerta
            if (StockActual <= StockMinimo)
            {
                Notificar();
            }
        }

        // Método para cuando llega mercancía nueva
        public void AumentarStock(int cantidad)
        {
            StockActual += cantidad;
        }

        private void Notificar()
        {
            foreach (var observador in _observadores)
            {
                observador.Actualizar(this);
            }
        }
    }
}