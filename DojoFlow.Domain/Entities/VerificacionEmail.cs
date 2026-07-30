using System;

namespace DojoFlow.Domain.Entities
{
    // Registro temporal: confirma que un correo es alcanzable ANTES de crear la cuenta de coach
    public class VerificacionEmail
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PinHash { get; set; } = string.Empty;
        public DateTime Expiracion { get; set; }
        public bool Verificado { get; set; }
    }
}
