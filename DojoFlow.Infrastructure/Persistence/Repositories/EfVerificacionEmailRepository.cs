using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfVerificacionEmailRepository : IVerificacionEmailRepository
    {
        private readonly DojoFlowDbContext _context;

        public EfVerificacionEmailRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task<VerificacionEmail?> ObtenerPorEmailAsync(string email)
        {
            var emailNormalizado = email.Trim().ToLowerInvariant();
            return await _context.VerificacionesEmail.FirstOrDefaultAsync(v => v.Email == emailNormalizado);
        }

        public async Task GuardarAsync(VerificacionEmail verificacion)
        {
            if (verificacion.Id == 0)
            {
                _context.VerificacionesEmail.Add(verificacion);
            }
            else
            {
                _context.VerificacionesEmail.Update(verificacion);
            }
            await _context.SaveChangesAsync();
        }

        public async Task EliminarAsync(VerificacionEmail verificacion)
        {
            _context.VerificacionesEmail.Remove(verificacion);
            await _context.SaveChangesAsync();
        }
    }
}
