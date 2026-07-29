using System;

namespace DojoFlow.Domain.Entities
{
    public class UsuarioCoach
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
    }
}