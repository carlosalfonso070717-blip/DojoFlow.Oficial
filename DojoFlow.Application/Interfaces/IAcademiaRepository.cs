using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IAcademiaRepository
    {
        Task<Academia?> ObtenerPorIdAsync(Guid id);
        Task<Academia?> ObtenerPorCodigoCatalogoAsync(string codigo);
        // Crea la academia, sus clases iniciales y su dueño en una sola transacción
        Task RegistrarAsync(Academia academia, IEnumerable<Clase> clases, UsuarioCoach dueno);
        Task ActualizarAsync(Academia academia);
    }
}
