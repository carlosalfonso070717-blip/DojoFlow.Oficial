using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfClaseRepository : IClaseRepository
    {
        private readonly DojoFlowDbContext _context;

        public EfClaseRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task<List<Clase>> ObtenerTodasAsync()
        {
            return await _context.Clases.AsNoTracking().OrderBy(c => c.Nombre).ToListAsync();
        }

        public async Task<Clase?> ObtenerPorIdAsync(Guid id)
        {
            return await _context.Clases.FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task AgregarAsync(Clase clase)
        {
            _context.Clases.Add(clase);
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarAsync(Clase clase)
        {
            _context.Clases.Update(clase);
            await _context.SaveChangesAsync();
        }

        public async Task EliminarAsync(Clase clase)
        {
            _context.Clases.Remove(clase);
            await _context.SaveChangesAsync();
        }
    }
}
