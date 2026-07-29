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

        public async Task<UsuarioCoach?> ObtenerPorUsernameAsync(string username)
        {
            return await _context.UsuariosCoach.FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task AgregarAsync(UsuarioCoach usuario)
        {
            _context.UsuariosCoach.Add(usuario);
            await _context.SaveChangesAsync();
        }
    }
}
