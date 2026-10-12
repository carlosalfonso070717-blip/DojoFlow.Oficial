using Google.Apis.Auth;

namespace DojoFlow.API.Services
{
    public record CuentaGoogle(string Email, string Nombre);

    // Valida el ID token que entrega "Continuar con Google" (web, Android o iOS)
    public class VerificadorGoogle
    {
        private readonly string[] _clientIds;

        public VerificadorGoogle(IConfiguration config)
        {
            // Google:ClientIds admite varios separados por coma (web, iOS, Android)
            _clientIds = (config["Google:ClientIds"] ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }

        public bool Configurado => _clientIds.Length > 0;

        // Devuelve null si el token no es válido, expiró, no es para esta app o el correo no está verificado
        public async Task<CuentaGoogle?> ValidarAsync(string? idToken)
        {
            if (!Configurado || string.IsNullOrWhiteSpace(idToken)) return null;

            try
            {
                var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = _clientIds
                });

                if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email)) return null;

                string email = payload.Email.Trim().ToLowerInvariant();
                string nombre = string.IsNullOrWhiteSpace(payload.Name) ? email.Split('@')[0] : payload.Name.Trim();
                return new CuentaGoogle(email, nombre);
            }
            catch (InvalidJwtException)
            {
                return null;
            }
        }
    }
}
