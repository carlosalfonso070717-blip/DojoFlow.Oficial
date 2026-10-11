using System;

namespace DojoFlow.Domain.Entities
{
    // Foto subida por la academia (de un producto o del perfil de un usuario).
    // Vive en su propia tabla para que listar productos o usuarios no cargue los bytes.
    public class Imagen : IPerteneceAAcademia
    {
        public Guid Id { get; set; }
        public Guid AcademiaId { get; set; }
        public byte[] Datos { get; set; } = Array.Empty<byte>();
        public string ContentType { get; set; } = "image/jpeg";
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        // Ruta pública con la que la sirve la API (el Id es aleatorio, por eso no requiere sesión)
        public string Url => $"/api/Imagenes/{Id}";

        // Si una URL guardada apunta a una imagen de esta tabla, devuelve su Id
        public static Guid? IdDesdeUrl(string? url)
        {
            const string prefijo = "/api/Imagenes/";
            if (string.IsNullOrEmpty(url) || !url.StartsWith(prefijo)) return null;
            return Guid.TryParse(url.AsSpan(prefijo.Length), out var id) ? id : null;
        }
    }
}
