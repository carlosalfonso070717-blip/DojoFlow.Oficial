using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using DojoFlow.Domain.Observers;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfProductoRepository : IProductoRepository
    {
        private static readonly AlertaStockObserver _vigia = new AlertaStockObserver();

        private readonly DojoFlowDbContext _context;

        public EfProductoRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task<List<Producto>> ObtenerTodosAsync()
        {
            return await _context.Productos.AsNoTracking().ToListAsync();
        }

        public async Task<Producto?> ObtenerPorIdAsync(Guid id)
        {
            var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == id);
            producto?.Suscribir(_vigia);
            return producto;
        }

        public async Task AgregarAsync(Producto producto)
        {
            producto.Suscribir(_vigia);
            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();
        }

        public async Task ActualizarAsync(Producto producto)
        {
            _context.Productos.Update(producto);
            await _context.SaveChangesAsync();
        }

        public async Task EliminarAsync(Producto producto)
        {
            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();
        }
    }
}
