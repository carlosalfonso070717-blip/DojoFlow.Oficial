using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IProductoRepository
    {
        Task<List<Producto>> ObtenerTodosAsync();
        // Para el catálogo público (sin sesión): productos visibles de una academia concreta
        Task<List<Producto>> ObtenerCatalogoAsync(Guid academiaId);
        Task<Producto?> ObtenerPorIdAsync(Guid id);
        Task AgregarAsync(Producto producto);
        Task ActualizarAsync(Producto producto);
        Task EliminarAsync(Producto producto);
    }
}
