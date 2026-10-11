using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagenesController : ControllerBase
    {
        public const int TamanoMaximo = 1024 * 1024;
        private static readonly string[] TiposPermitidos = { "image/png", "image/jpeg", "image/webp" };

        private readonly IImagenRepository _imagenRepository;

        public ImagenesController(IImagenRepository imagenRepository)
        {
            _imagenRepository = imagenRepository;
        }

        // Valida y lee una foto subida; devuelve el error para el usuario si no sirve
        public static async Task<(Imagen? Imagen, string? Error)> LeerAsync(IFormFile? archivo)
        {
            if (archivo == null || archivo.Length == 0)
                return (null, "No se recibió ninguna imagen.");
            if (archivo.Length > TamanoMaximo)
                return (null, "La imagen no puede pesar más de 1 MB.");
            if (!TiposPermitidos.Contains(archivo.ContentType))
                return (null, "La imagen debe ser PNG, JPG o WEBP.");

            using var memoria = new MemoryStream();
            await archivo.CopyToAsync(memoria);
            return (new Imagen { Id = Guid.NewGuid(), Datos = memoria.ToArray(), ContentType = archivo.ContentType }, null);
        }

        // Pública para que <img> la cargue sin token (también en el catálogo). Cada foto nueva
        // tiene otro Id, así que el contenido de una URL nunca cambia y se cachea un año.
        [AllowAnonymous]
        [HttpGet("{id}")]
        [ResponseCache(Duration = 31536000)]
        public async Task<IActionResult> Obtener(Guid id)
        {
            var imagen = await _imagenRepository.ObtenerPublicaAsync(id);
            return imagen == null ? NotFound() : File(imagen.Datos, imagen.ContentType);
        }
    }
}
