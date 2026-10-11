using System;
using System.Collections.Generic;
using System.Linq;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Domain.Services
{
    public record ResultadoCiclo(List<Mensualidad> Vencidas, Mensualidad? Nueva)
    {
        public bool HuboCambios => Vencidas.Count > 0 || Nueva != null;
    }

    // Reglas del ciclo mensual de cobro de un alumno:
    // 1. Un recibo pendiente cuya fecha de vencimiento ya pasó se vuelve Vencido.
    // 2. Cuando el último recibo está pagado, el del mes siguiente aparece como Pendiente
    //    unos días antes de su vencimiento (aviso previo).
    // 3. Mientras el último recibo no se pague, no se generan más: la deuda no se acumula
    //    sola si el alumno deja de venir; al pagar, la cadena continúa desde ese mes.
    public static class CicloMensualidades
    {
        public const int DiasAvisoPrevio = 7;

        public static ResultadoCiclo Aplicar(Alumno alumno, IEnumerable<Mensualidad> recibosDelAlumno, DateTime hoy)
        {
            var recibos = recibosDelAlumno.OrderBy(r => r.FechaVencimiento).ToList();
            var vencidas = new List<Mensualidad>();

            foreach (var recibo in recibos.Where(r => r.EstadoActual == "Pendiente" && r.FechaVencimiento.Date < hoy.Date))
            {
                recibo.MarcarComoVencida();
                vencidas.Add(recibo);
            }

            var ultimo = recibos.LastOrDefault();
            if (!alumno.Activo || ultimo == null || ultimo.EstadoActual != "Pagado")
                return new ResultadoCiclo(vencidas, null);

            var siguienteVencimiento = ultimo.FechaVencimiento.AddMonths(1);
            if (hoy.Date < siguienteVencimiento.Date.AddDays(-DiasAvisoPrevio))
                return new ResultadoCiclo(vencidas, null);

            var nueva = new Mensualidad(alumno.Id, alumno.CostoMensualidad, siguienteVencimiento)
            {
                AcademiaId = alumno.AcademiaId
            };
            // Si se pagó muy tarde, el siguiente mes puede haber vencido ya
            if (siguienteVencimiento.Date < hoy.Date) nueva.MarcarComoVencida();

            return new ResultadoCiclo(vencidas, nueva);
        }

        // El estatus que importa en recepción: si debe algo, está vencido
        public static string EstatusActual(IEnumerable<Mensualidad> recibosDelAlumno)
        {
            var recibos = recibosDelAlumno.OrderBy(r => r.FechaVencimiento).ToList();
            if (recibos.Count == 0) return "Sin Recibo";
            if (recibos.Any(r => r.EstadoActual == "Vencido")) return "Vencido";
            return recibos.Last().EstadoActual;
        }
    }
}
