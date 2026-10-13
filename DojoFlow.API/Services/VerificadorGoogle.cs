using Google.Apis.Auth;
using System.Net.Http.Headers;
using System.Text.Json;

namespace DojoFlow.API.Services
{
    public record CuentaGoogle(string Email, string Nombre);

    // Valida la credencial que entrega "Continuar con Google":
    // un ID token (app de Android/iOS) o un access token del flujo OAuth con ventana emergente (web)
    public class VerificadorGoogle
    {
        private readonly string[] _clientIds;
        private readonly HttpClient _http;

        public VerificadorGoogle(IConfiguration config, HttpClient http)
        {
            _http = http;
            // Google:ClientIds admite varios separados por coma (web, iOS, Android).
            // Una variable de entorno vacía no debe tapar el valor de appsettings.json.
            var ids = new[] { config["GOOGLE_WEB_CLIENT_ID"], config["Google:ClientIds"] }.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));
            _clientIds = (ids ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }

        public bool Configurado => _clientIds.Length > 0;

        // Devuelve null si la credencial no es válida, expiró, no es para esta app o el correo no está verificado
        public Task<CuentaGoogle?> ValidarAsync(string? idToken, string? accessToken) =>
            !string.IsNullOrWhiteSpace(idToken) ? ValidarIdTokenAsync(idToken) : ValidarAccessTokenAsync(accessToken);

        private async Task<CuentaGoogle?> ValidarIdTokenAsync(string idToken)
        {
            if (!Configurado) return null;

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

        // Google confirma a qué app pertenece el token (aud) y luego da el perfil de la cuenta.
        // Sin revisar aud, un token emitido para otra app serviría para entrar aquí.
        private async Task<CuentaGoogle?> ValidarAccessTokenAsync(string? accessToken)
        {
            if (!Configurado || string.IsNullOrWhiteSpace(accessToken)) return null;

            try
            {
                using var info = await LeerJsonAsync(new HttpRequestMessage(HttpMethod.Get,
                    $"https://oauth2.googleapis.com/tokeninfo?access_token={Uri.EscapeDataString(accessToken)}"));
                string? aud = info?.RootElement.TryGetProperty("aud", out var a) == true ? a.GetString() : null;
                if (aud == null || !_clientIds.Contains(aud)) return null;

                var pedido = new HttpRequestMessage(HttpMethod.Get, "https://openidconnect.googleapis.com/v1/userinfo");
                pedido.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                using var perfil = await LeerJsonAsync(pedido);
                if (perfil == null) return null;
                var raiz = perfil.RootElement;

                bool verificado = raiz.TryGetProperty("email_verified", out var v) && v.ValueKind == JsonValueKind.True;
                string? correo = raiz.TryGetProperty("email", out var e) ? e.GetString() : null;
                if (!verificado || string.IsNullOrWhiteSpace(correo)) return null;

                string email = correo.Trim().ToLowerInvariant();
                string? nombreGoogle = raiz.TryGetProperty("name", out var n) ? n.GetString() : null;
                string nombre = string.IsNullOrWhiteSpace(nombreGoogle) ? email.Split('@')[0] : nombreGoogle.Trim();
                return new CuentaGoogle(email, nombre);
            }
            catch (HttpRequestException)
            {
                return null;
            }
        }

        private async Task<JsonDocument?> LeerJsonAsync(HttpRequestMessage pedido)
        {
            using var respuesta = await _http.SendAsync(pedido);
            if (!respuesta.IsSuccessStatusCode) return null;
            return await JsonDocument.ParseAsync(await respuesta.Content.ReadAsStreamAsync());
        }
    }
}
