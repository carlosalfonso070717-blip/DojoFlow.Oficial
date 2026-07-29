using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfAlumnoRepository : IAlumnoRepository
    {
        private readonly DojoFlowDbContext _context;

        public EfAlumnoRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task<List<Alumno>> ObtenerTodosAsync()
        {
            return await _context.Alumnos.AsNoTracking().ToListAsync();
        }

        public async Task<Alumno?> ObtenerPorIdAsync(Guid id)
        {
            return await _context.Alumnos.FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Alumno?> ObtenerPorPinAsync(int claveKiosco)
        {
            return await _context.Alumnos.AsNoTracking().FirstOrDefaultAsync(a => a.ClaveKiosco == claveKiosco);
        }

        public async Task GuardarAsync(Alumno alumno)
        {
            _context.Alumnos.Add(alumno);
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarAsync(Alumno alumno)
        {
            _context.Alumnos.Update(alumno);
            await _context.SaveChangesAsync();
        }

        public async Task EliminarAsync(Alumno alumno)
        {
            _context.Alumnos.Remove(alumno);
            await _context.SaveChangesAsync();
        }
    }
}
