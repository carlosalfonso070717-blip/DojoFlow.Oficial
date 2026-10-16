using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfUsuarioCoachRepository : IUsuarioCoachRepository
    {
        private readonly DojoFlowDbContext _context;

        public EfUsuarioCoachRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task<UsuarioCoach?> ObtenerPorEmailAsync(string email)
        {
            var emailNormalizado = email.Trim().ToLowerInvariant();
            return await _context.UsuariosCoach.FirstOrDefaultAsync(u => u.Email == emailNormalizado);
        }

        public async Task<UsuarioCoach?> ObtenerPorIdAsync(Guid id)
        {
            return await _context.UsuariosCoach.FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<bool> ExisteEnAcademiaAsync(Guid academiaId)
        {
            return await _context.UsuariosCoach.AnyAsync(u => u.AcademiaId == academiaId);
        }

        public async Task AgregarAsync(UsuarioCoach usuario)
        {
            _context.UsuariosCoach.Add(usuario);
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarAsync(UsuarioCoach usuario)
        {
            _context.UsuariosCoach.Update(usuario);
            await _context.SaveChangesAsync();
        }
    }
}
