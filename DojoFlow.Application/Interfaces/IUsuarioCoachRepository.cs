using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IUsuarioCoachRepository
    {
        Task<UsuarioCoach?> ObtenerPorEmailAsync(string email);
        Task<UsuarioCoach?> ObtenerPorIdAsync(Guid id);
        // Si alguna cuenta del panel pertenece a esa academia (o sucursal)
        Task<bool> ExisteEnAcademiaAsync(Guid academiaId);
        Task AgregarAsync(UsuarioCoach usuario);
        Task ActualizarAsync(UsuarioCoach usuario);
    }
}
