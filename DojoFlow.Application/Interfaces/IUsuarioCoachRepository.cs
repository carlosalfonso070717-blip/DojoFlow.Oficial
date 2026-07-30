using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IUsuarioCoachRepository
    {
        Task<UsuarioCoach?> ObtenerPorEmailAsync(string email);
        Task<UsuarioCoach?> ObtenerPorTokenVerificacionAsync(string token);
        Task AgregarAsync(UsuarioCoach usuario);
        Task ActualizarAsync(UsuarioCoach usuario);
    }
}
