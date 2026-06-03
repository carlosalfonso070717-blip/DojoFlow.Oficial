using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IAlumnoRepository
    {
        Task<Alumno> ObtenerPorIdAsync(Guid id);
        Task<IEnumerable<Alumno>> ObtenerTodosAsync();
        Task GuardarAsync(Alumno alumno);
        Task ActualizarAsync(Alumno alumno);
    }
}