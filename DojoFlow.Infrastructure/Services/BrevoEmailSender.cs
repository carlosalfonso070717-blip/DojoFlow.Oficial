using System.Net.Http.Json;
using DojoFlow.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DojoFlow.Infrastructure.Services
{
    public class BrevoEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly ILogger<BrevoEmailSender> _logger;

        public BrevoEmailSender(IConfiguration config, HttpClient httpClient, ILogger<BrevoEmailSender> logger)
        {
            _config = config;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task EnviarAsync(string destinatario, string asunto, string cuerpoHtml)
        {
            var apiKey = _config["Brevo:ApiKey"] ?? throw new InvalidOperationException("Falta configurar Brevo:ApiKey.");
            var remitente = _config["Brevo:SenderEmail"] ?? throw new InvalidOperationException("Falta configurar Brevo:SenderEmail.");

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            request.Headers.Add("api-key", apiKey);
            request.Headers.Add("accept", "application/json");
            request.Content = JsonContent.Create(new
            {
                // Para que llegue a la bandeja, el remitente debe ser de un dominio autenticado en Brevo
                // (p. ej. no-reply@dojoflow.club); un remitente @gmail.com falla la verificación DMARC
                sender = new { email = remitente, name = _config["Brevo:SenderName"] ?? "DojoFlow" },
                to = new[] { new { email = destinatario } },
                subject = asunto,
                htmlContent = cuerpoHtml
            });

            var response = await _httpClient.SendAsync(request);

            var detalle = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Brevo rechazó el correo para {Destinatario} ({Estado}): {Detalle}", destinatario, (int)response.StatusCode, detalle);
                throw new InvalidOperationException($"Brevo rechazó el envío del correo ({(int)response.StatusCode}): {detalle}");
            }

            // Brevo aceptó el correo: el messageId sirve para rastrear la entrega en su panel (Transactional > Logs)
            _logger.LogInformation("Correo aceptado por Brevo para {Destinatario} desde {Remitente}: {Respuesta}", destinatario, remitente, detalle);
        }
    }
}
