using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IMensualidadRepository
    {
        Task<List<Mensualidad>> ObtenerTodasAsync();
        Task<Mensualidad?> ObtenerPorIdAsync(Guid id);
        Task<Mensualidad?> ObtenerPorAlumnoIdAsync(Guid alumnoId);
        Task AgregarAsync(Mensualidad mensualidad);
        Task ActualizarAsync(Mensualidad mensualidad);
        Task EliminarPorAlumnoIdAsync(Guid alumnoId);
    }
}
