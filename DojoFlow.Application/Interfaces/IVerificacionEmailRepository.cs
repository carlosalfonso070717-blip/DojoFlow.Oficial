using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IVerificacionEmailRepository
    {
        Task<VerificacionEmail?> ObtenerPorEmailAsync(string email);
        Task GuardarAsync(VerificacionEmail verificacion);
        Task EliminarAsync(VerificacionEmail verificacion);
    }
}
