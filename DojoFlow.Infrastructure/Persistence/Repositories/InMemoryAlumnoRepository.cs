using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    // Este Adaptador implementa el Puerto (Interfaz) que creamos en la capa de Aplicación
    public class InMemoryAlumnoRepository : IAlumnoRepository
    {
        // Simulamos una tabla de base de datos con una lista
        private static readonly List<Alumno> _alumnos = new List<Alumno>();

        public async Task<Alumno> ObtenerPorIdAsync(Guid id)
        {
            var alumno = _alumnos.FirstOrDefault(a => a.Id == id);
            return await Task.FromResult(alumno);
        }

        public async Task<IEnumerable<Alumno>> ObtenerTodosAsync()
        {
            return await Task.FromResult(_alumnos);
        }

        public async Task GuardarAsync(Alumno alumno)
        {
            _alumnos.Add(alumno);
            await Task.CompletedTask;
        }

        public async Task ActualizarAsync(Alumno alumno)
        {
            var index = _alumnos.FindIndex(a => a.Id == alumno.Id);
            if (index != -1)
            {
                _alumnos[index] = alumno;
            }
            await Task.CompletedTask;
        }
    }
}