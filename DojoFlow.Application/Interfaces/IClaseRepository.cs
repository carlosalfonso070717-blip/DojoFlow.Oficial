using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IClaseRepository
    {
        Task<List<Clase>> ObtenerTodasAsync();
        Task<Clase?> ObtenerPorIdAsync(Guid id);
        Task AgregarAsync(Clase clase);
        Task ActualizarAsync(Clase clase);
        Task EliminarAsync(Clase clase);
    }
}
