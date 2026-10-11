using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfAcademiaRepository : IAcademiaRepository
    {
        private readonly DojoFlowDbContext _context;

        public EfAcademiaRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task<Academia?> ObtenerPorIdAsync(Guid id)
        {
            return await _context.Academias.FirstOrDefaultAsync(a => a.Id == id);
        }

        public async Task<Academia?> ObtenerPorCodigoCatalogoAsync(string codigo)
        {
            return await _context.Academias.AsNoTracking().FirstOrDefaultAsync(a => a.CodigoCatalogo == codigo);
        }

        public async Task RegistrarAsync(Academia academia, IEnumerable<Clase> clases, UsuarioCoach dueno)
        {
            // Un solo SaveChanges = una sola transacción: o se crea todo o nada
            _context.Academias.Add(academia);
            _context.Clases.AddRange(clases);
            _context.UsuariosCoach.Add(dueno);
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarAsync(Academia academia)
        {
            _context.Academias.Update(academia);
            await _context.SaveChangesAsync();
        }
    }
}
