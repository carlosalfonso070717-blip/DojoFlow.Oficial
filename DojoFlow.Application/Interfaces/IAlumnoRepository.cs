using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IAlumnoRepository
    {
        Task<List<Alumno>> ObtenerTodosAsync();
        Task<Alumno?> ObtenerPorIdAsync(Guid id);
        Task<Alumno?> ObtenerPorPinAsync(int claveKiosco);
        Task GuardarAsync(Alumno alumno);
        Task ActualizarAsync(Alumno alumno);
        Task EliminarAsync(Alumno alumno);
    }
}
