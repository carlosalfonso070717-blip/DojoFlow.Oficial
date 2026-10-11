using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfAsistenciaRepository : IAsistenciaRepository
    {
        private readonly DojoFlowDbContext _context;

        public EfAsistenciaRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task AgregarAsync(Asistencia asistencia)
        {
            _context.Asistencias.Add(asistencia);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Asistencia>> ObtenerEntreAsync(DateTime desde, DateTime hasta)
        {
            return await _context.Asistencias.AsNoTracking()
                .Where(a => a.FechaHora >= desde && a.FechaHora < hasta)
                .OrderByDescending(a => a.FechaHora)
                .ToListAsync();
        }
    }
}
