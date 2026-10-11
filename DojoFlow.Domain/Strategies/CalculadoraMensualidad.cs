using System;
using System.Collections.Generic;
using System.Linq;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Domain.Strategies
{
    public interface ICalculoMensualidadStrategy
    {
        decimal CalcularCosto();
    }

    // Estrategia por paquete: la academia define un precio por cantidad de clases
    // (ej. Dominio Combat Club: 1 = $850, 2 = $1500, 3 = $2400...). Si el alumno toma
    // más clases que paquetes definidos, se usa el paquete más grande.
    public class PrecioPorPaqueteStrategy : ICalculoMensualidadStrategy
    {
        private readonly IReadOnlyList<decimal> _preciosPaquete;
        private readonly int _cantidadClases;

        public PrecioPorPaqueteStrategy(IReadOnlyList<decimal> preciosPaquete, int cantidadClases)
        {
            _preciosPaquete = preciosPaquete;
            _cantidadClases = cantidadClases;
        }

        public decimal CalcularCosto()
        {
            if (_preciosPaquete.Count == 0 || _cantidadClases <= 0) return 0m;
            int indice = Math.Min(_cantidadClases, _preciosPaquete.Count) - 1;
            return _preciosPaquete[indice];
        }
    }

    // Estrategia por clase: se suma el precio individual de cada clase inscrita
    public class PrecioPorClaseStrategy : ICalculoMensualidadStrategy
    {
        private readonly IEnumerable<Clase> _clases;

        public PrecioPorClaseStrategy(IEnumerable<Clase> clases)
        {
            _clases = clases;
        }

        public decimal CalcularCosto() => _clases.Sum(c => c.Precio);
    }

    public class CalculadoraMensualidad
    {
        private readonly ICalculoMensualidadStrategy _estrategia;

        public CalculadoraMensualidad(Academia academia, IReadOnlyCollection<Clase> clasesInscritas)
        {
            // El contexto elige la estrategia según cómo cobra cada academia
            _estrategia = academia.ModoCobro switch
            {
                ModoCobro.Paquete => new PrecioPorPaqueteStrategy(academia.PreciosPaquete, clasesInscritas.Count),
                _ => new PrecioPorClaseStrategy(clasesInscritas)
            };
        }

        public decimal ObtenerCostoMensual() => _estrategia.CalcularCosto();
    }
}
