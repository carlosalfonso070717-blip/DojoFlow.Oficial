using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IUsuarioCoachRepository
    {
        Task<UsuarioCoach?> ObtenerPorUsernameAsync(string username);
        Task AgregarAsync(UsuarioCoach usuario);
    }
}
