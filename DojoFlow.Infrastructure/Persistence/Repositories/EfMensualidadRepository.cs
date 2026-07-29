using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfMensualidadRepository : IMensualidadRepository
    {
        private readonly DojoFlowDbContext _context;

        public EfMensualidadRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task<List<Mensualidad>> ObtenerTodasAsync()
        {
            return await _context.Mensualidades.AsNoTracking().ToListAsync();
        }

        public async Task<Mensualidad?> ObtenerPorIdAsync(Guid id)
        {
            return await _context.Mensualidades.FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<Mensualidad?> ObtenerPorAlumnoIdAsync(Guid alumnoId)
        {
            return await _context.Mensualidades.FirstOrDefaultAsync(m => m.AlumnoId == alumnoId);
        }

        public async Task AgregarAsync(Mensualidad mensualidad)
        {
            _context.Mensualidades.Add(mensualidad);
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarAsync(Mensualidad mensualidad)
        {
            _context.Mensualidades.Update(mensualidad);
            await _context.SaveChangesAsync();
        }

        public async Task EliminarPorAlumnoIdAsync(Guid alumnoId)
        {
            var mensualidades = await _context.Mensualidades.Where(m => m.AlumnoId == alumnoId).ToListAsync();
            _context.Mensualidades.RemoveRange(mensualidades);
            await _context.SaveChangesAsync();
        }
    }
}
