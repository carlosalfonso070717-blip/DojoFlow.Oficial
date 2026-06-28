// Ubicación: DojoFlow.Domain/Observers/AlertaStockObserver.cs
using System;
using System.Collections.Generic;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Domain.Observers
{
    public class AlertaStockObserver : INotificadorInventario
    {
        // Lista estática para guardar las alertas generadas y mandarlas al Frontend
        public static readonly List<string> AlertasActivas = new();

        public void Actualizar(Producto producto)
        {
            string mensaje = $"⚠️ ALERTA: El producto '{producto.Nombre}' ha bajado a {producto.StockActual} unidades (Mínimo permitido: {producto.StockMinimo}). ¡Es hora de resurtir!";

            // Evitamos duplicar la misma alerta exacta
            if (!AlertasActivas.Contains(mensaje))
            {
                AlertasActivas.Add(mensaje);
            }
        }
    }
}