using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IAsistenciaRepository
    {
        Task AgregarAsync(Asistencia asistencia);
        // Registros con FechaHora en [desde, hasta), del más reciente al más viejo
        Task<List<Asistencia>> ObtenerEntreAsync(DateTime desde, DateTime hasta);
    }
}
