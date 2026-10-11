// Ubicación: DojoFlow.Domain/Observers/AlertaStockObserver.cs
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Domain.Observers
{
    public class AlertaStockObserver : INotificadorInventario
    {
        // Alertas en memoria separadas por academia, para que cada una solo vea las suyas
        private static readonly ConcurrentDictionary<Guid, List<string>> _alertasPorAcademia = new();

        public void Actualizar(Producto producto)
        {
            string mensaje = $"⚠️ ALERTA: El producto '{producto.Nombre}' ha bajado a {producto.StockActual} unidades (Mínimo permitido: {producto.StockMinimo}). ¡Es hora de resurtir!";
            var alertas = _alertasPorAcademia.GetOrAdd(producto.AcademiaId, _ => new List<string>());

            lock (alertas)
            {
                // Una sola alerta vigente por producto: la nueva reemplaza a la anterior
                alertas.RemoveAll(a => a.Contains($"'{producto.Nombre}'"));
                alertas.Add(mensaje);
            }
        }

        public static List<string> ObtenerAlertas(Guid academiaId)
        {
            if (!_alertasPorAcademia.TryGetValue(academiaId, out var alertas)) return new List<string>();
            lock (alertas) return new List<string>(alertas);
        }

        public static void QuitarAlertasDe(Guid academiaId, string nombreProducto)
        {
            if (!_alertasPorAcademia.TryGetValue(academiaId, out var alertas)) return;
            lock (alertas) alertas.RemoveAll(a => a.Contains($"'{nombreProducto}'"));
        }
    }
}
