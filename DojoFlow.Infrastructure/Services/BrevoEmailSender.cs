using System.Net.Http.Json;
using DojoFlow.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace DojoFlow.Infrastructure.Services
{
    public class BrevoEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public BrevoEmailSender(IConfiguration config, HttpClient httpClient)
        {
            _config = config;
            _httpClient = httpClient;
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
                sender = new { email = remitente, name = "DojoFlow" },
                to = new[] { new { email = destinatario } },
                subject = asunto,
                htmlContent = cuerpoHtml
            });

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var detalle = await response.Content.ReadAsStringAsync();
                throw new InvalidOperationException($"Brevo rechazó el envío del correo ({(int)response.StatusCode}): {detalle}");
            }
        }
    }
}
