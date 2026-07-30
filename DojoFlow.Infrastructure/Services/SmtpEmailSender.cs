using DojoFlow.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace DojoFlow.Infrastructure.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _config;

        public SmtpEmailSender(IConfiguration config)
        {
            _config = config;
        }

        public async Task EnviarAsync(string destinatario, string asunto, string cuerpoHtml)
        {
            var host = _config["Smtp:Host"] ?? "smtp.gmail.com";
            var port = int.Parse(_config["Smtp:Port"] ?? "587");
            var usuario = _config["Smtp:User"];
            var password = _config["Smtp:Password"];
            var remitente = _config["Smtp:From"] ?? usuario ?? throw new InvalidOperationException("Falta configurar Smtp:User/Smtp:From.");

            using var mensaje = new MailMessage
            {
                From = new MailAddress(remitente, "DojoFlow"),
                Subject = asunto,
                Body = cuerpoHtml,
                IsBodyHtml = true
            };
            mensaje.To.Add(destinatario);

            using var cliente = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(usuario, password),
                EnableSsl = true
            };

            await cliente.SendMailAsync(mensaje);
        }
    }
}
