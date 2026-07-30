using System;

namespace DojoFlow.Domain.Entities
{
    public class UsuarioCoach
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        // Recuperación de contraseña vía PIN enviado por correo
        public string? ResetPinHash { get; set; }
        public DateTime? ResetPinExpiracion { get; set; }

        // Verificación de correo al registrarse
        public bool EmailVerificado { get; set; }
        public string? TokenVerificacion { get; set; }
    }
}
