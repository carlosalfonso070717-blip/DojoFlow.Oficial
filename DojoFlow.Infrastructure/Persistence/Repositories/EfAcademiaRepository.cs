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

        public async Task<List<Academia>> ObtenerGrupoAsync(Guid grupoId)
        {
            return await _context.Academias
                .Where(a => a.Id == grupoId || a.MatrizId == grupoId)
                .OrderBy(a => a.MatrizId != null)
                .ThenBy(a => a.FechaCreacion)
                .ToListAsync();
        }

        public async Task RegistrarAsync(IEnumerable<Academia> academias, IEnumerable<Clase> clases, UsuarioCoach dueno)
        {
            // Un solo SaveChanges = una sola transacción: o se crea todo o nada
            _context.Academias.AddRange(academias);
            _context.Clases.AddRange(clases);
            _context.UsuariosCoach.Add(dueno);
            await _context.SaveChangesAsync();
        }

        public async Task AgregarSucursalAsync(Academia sucursal, IEnumerable<Clase> clases)
        {
            _context.Academias.Add(sucursal);
            _context.Clases.AddRange(clases);
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarAsync(Academia academia)
        {
            _context.Academias.Update(academia);
            await _context.SaveChangesAsync();
        }

        public async Task EliminarAsync(Academia academia)
        {
            _context.Academias.Remove(academia);
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarAsync(IEnumerable<Academia> academias)
        {
            _context.Academias.UpdateRange(academias);
            await _context.SaveChangesAsync();
        }
    }
}
