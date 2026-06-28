using DojoFlow.Domain.Entities;

namespace DojoFlow.Domain.Observers
{
    public interface INotificadorInventario
    {
        void Actualizar(Producto producto);
    }
}