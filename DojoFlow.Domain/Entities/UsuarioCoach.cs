using System;

namespace DojoFlow.Domain.Entities
{
    public class UsuarioCoach
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        // Academia a la que pertenece. No usa el filtro multi-tenant porque el login
        // busca al usuario por correo antes de saber de qué academia es.
        public Guid AcademiaId { get; set; }
        public string Rol { get; set; } = Roles.Dueno;
        // Si ya vio el tour de bienvenida de la app
        public bool TourCompletado { get; set; }
        // Foto de perfil (ruta de /api/Imagenes); null = se muestran sus iniciales
        public string? FotoUrl { get; set; }

        // Recuperación de contraseña vía PIN enviado por correo
        public string? ResetPinHash { get; set; }
        public DateTime? ResetPinExpiracion { get; set; }
    }
}
