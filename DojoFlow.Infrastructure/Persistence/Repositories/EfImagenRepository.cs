using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfImagenRepository : IImagenRepository
    {
        private readonly DojoFlowDbContext _context;

        public EfImagenRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task<Imagen?> ObtenerPublicaAsync(Guid id)
        {
            return await _context.Imagenes.IgnoreQueryFilters().AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        }

        public async Task AgregarAsync(Imagen imagen)
        {
            _context.Imagenes.Add(imagen);
            await _context.SaveChangesAsync();
        }

        public async Task EliminarPorUrlAsync(string? url)
        {
            var id = Imagen.IdDesdeUrl(url);
            if (id == null) return;

            // Con filtro de academia: nadie puede borrar imágenes de otra
            await _context.Imagenes.Where(i => i.Id == id).ExecuteDeleteAsync();
        }
    }
}
