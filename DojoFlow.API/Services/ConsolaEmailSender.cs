using DojoFlow.Application.Interfaces;

namespace DojoFlow.API.Services
{
    // Solo para desarrollo local sin Brevo configurado: el correo (con su PIN) se escribe en el log
    public class ConsolaEmailSender : IEmailSender
    {
        private readonly ILogger<ConsolaEmailSender> _logger;

        public ConsolaEmailSender(ILogger<ConsolaEmailSender> logger)
        {
            _logger = logger;
        }

        public Task EnviarAsync(string destinatario, string asunto, string cuerpoHtml)
        {
            _logger.LogWarning("CORREO DE DESARROLLO para {Destinatario} | {Asunto} | {Cuerpo}", destinatario, asunto, cuerpoHtml);
            return Task.CompletedTask;
        }
    }
}
