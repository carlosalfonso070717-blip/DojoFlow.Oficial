namespace DojoFlow.Domain.Strategies
{
    public interface ICalculoMensualidadStrategy
    {
        decimal CalcularCosto();
    }

    // Estrategia 1: Disciplinas de contacto total e híbridas (MMA / JiuJitsu)
    public class PrecioFullCombatStrategy : ICalculoMensualidadStrategy
    {
        public decimal CalcularCosto() => 800.00m;
    }

    // Estrategia 2: Disciplinas puras de Striking (Boxeo / Kickboxing)
    public class PrecioStrikingStrategy : ICalculoMensualidadStrategy
    {
        public decimal CalcularCosto() => 500.00m;
    }

    // Estrategia 3: Disciplinas de derribo y proyección (Judo)
    public class PrecioGrapplingStrategy : ICalculoMensualidadStrategy
    {
        public decimal CalcularCosto() => 600.00m;
    }

    public class CalculadoraMensualidad
    {
        private readonly ICalculoMensualidadStrategy _estrategia;

        public CalculadoraMensualidad(string disciplina)
        {
            // El motor evalúa rigurosamente las 5 disciplinas de la academia
            _estrategia = disciplina.ToLower().Trim() switch
            {
                "mma" or "jiujitsu" => new PrecioFullCombatStrategy(),
                "boxeo" or "kickboxing" => new PrecioStrikingStrategy(),
                "judo" => new PrecioGrapplingStrategy(),
                _ => new PrecioStrikingStrategy() // Estrategia por defecto
            };
        }

        public decimal ObtenerCostoMensual()
        {
            return _estrategia.CalcularCosto();
        }
    }
}