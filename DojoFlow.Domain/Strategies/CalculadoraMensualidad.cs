using System.Collections.Generic;

namespace DojoFlow.Domain.Strategies
{
    public interface ICalculoMensualidadStrategy
    {
        decimal CalcularCosto();
    }

    // Estrategia 1 disciplina: $850 c/u
    public class PrecioIndividualStrategy : ICalculoMensualidadStrategy { public decimal CalcularCosto() => 850.00m; }

    // Estrategia 2 disciplinas: combo $1500
    public class PrecioDobleStrategy : ICalculoMensualidadStrategy { public decimal CalcularCosto() => 1500.00m; }

    // Estrategia 3 disciplinas: combo $2400
    public class PrecioTripleStrategy : ICalculoMensualidadStrategy { public decimal CalcularCosto() => 2400.00m; }

    // Estrategia 4 disciplinas: combo $3200
    public class PrecioCuadrupleStrategy : ICalculoMensualidadStrategy { public decimal CalcularCosto() => 3200.00m; }

    // Estrategia 5 disciplinas (Full Academy): combo $4000
    public class PrecioFullAcademyStrategy : ICalculoMensualidadStrategy { public decimal CalcularCosto() => 4000.00m; }

    public class CalculadoraMensualidad
    {
        private readonly ICalculoMensualidadStrategy _estrategia;

        public CalculadoraMensualidad(int cantidadDisciplinas)
        {
            // El contexto selecciona la estrategia adecuada según el tamaño de la lista
            _estrategia = cantidadDisciplinas switch
            {
                1 => new PrecioIndividualStrategy(),
                2 => new PrecioDobleStrategy(),
                3 => new PrecioTripleStrategy(),
                4 => new PrecioCuadrupleStrategy(),
                5 => new PrecioFullAcademyStrategy(),
                _ => new PrecioIndividualStrategy() // Por si mandan un número inválido o 0
            };
        }

        public decimal ObtenerCostoMensual() => _estrategia.CalcularCosto();
    }
}