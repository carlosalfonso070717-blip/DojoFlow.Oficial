using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IImagenRepository
    {
        // Sin filtro de academia: las imágenes se muestran en el catálogo público
        Task<Imagen?> ObtenerPublicaAsync(Guid id);
        Task AgregarAsync(Imagen imagen);
        // Borra la imagen a la que apunta la URL, si es una de las nuestras
        Task EliminarPorUrlAsync(string? url);
    }
}
