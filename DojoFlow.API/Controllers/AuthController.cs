using BCrypt.Net;
using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private const int MinutosValidezPin = 15;

        private readonly IUsuarioCoachRepository _usuarioRepository;
        private readonly IEmailSender _emailSender;
        private readonly IConfiguration _config;

        public AuthController(IUsuarioCoachRepository usuarioRepository, IEmailSender emailSender, IConfiguration config)
        {
            _usuarioRepository = usuarioRepository;
            _emailSender = emailSender;
            _config = config;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> RegistrarCoach([FromBody] RegistroRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { Error = "El nombre, correo y contraseña son obligatorios." });
            }

            if (!EsEmailValido(request.Email))
            {
                return BadRequest(new { Error = "El correo no tiene un formato válido." });
            }

            if (request.Password.Length < 6)
            {
                return BadRequest(new { Error = "La contraseña debe tener al menos 6 caracteres." });
            }

            if (await _usuarioRepository.ObtenerPorEmailAsync(request.Email) != null)
            {
                return BadRequest(new { Error = "Ya existe un coach registrado con ese correo." });
            }

            var nuevoCoach = new UsuarioCoach
            {
                Id = Guid.NewGuid(),
                Nombre = request.Nombre.Trim(),
                Email = request.Email.Trim().ToLowerInvariant(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                EmailVerificado = false,
                TokenVerificacion = Guid.NewGuid().ToString("N")
            };

            await _usuarioRepository.AgregarAsync(nuevoCoach);

            string urlVerificacion = $"{Request.Scheme}://{Request.Host}/api/Auth/verificar-correo?token={nuevoCoach.TokenVerificacion}";

            string cuerpoVerificacion = $@"
                <div style='font-family:sans-serif;'>
                    <h2 style='color:#e53935;'>DojoFlow</h2>
                    <p>Hola {nuevoCoach.Nombre}, gracias por registrarte como coach. Confirma que este es tu correo dándole clic al botón:</p>
                    <p>
                        <a href='{urlVerificacion}' style='display:inline-block; background-color:#e53935; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:4px; font-weight:bold;'>
                            Verificar mi correo
                        </a>
                    </p>
                    <p>Si el botón no funciona, copia y pega este link en tu navegador:<br>{urlVerificacion}</p>
                </div>";

            await _emailSender.EnviarAsync(nuevoCoach.Email, "Verifica tu correo - DojoFlow", cuerpoVerificacion);

            return Ok(new { Mensaje = "Coach registrado. Revisa tu correo y verifica tu cuenta antes de iniciar sesión." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> IniciarSesion([FromBody] LoginRequest request)
        {
            var coach = await _usuarioRepository.ObtenerPorEmailAsync(request.Email);

            if (coach == null || !BCrypt.Net.BCrypt.Verify(request.Password, coach.PasswordHash))
            {
                return Unauthorized(new { Error = "Correo o contraseña incorrectos." });
            }

            if (!coach.EmailVerificado)
            {
                return Unauthorized(new { Error = "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada." });
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, coach.Email),
                new Claim("nombre", coach.Nombre),
                new Claim("id", coach.Id.ToString()),
                new Claim(ClaimTypes.Role, "Coach")
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: credentials);

            string tokenReal = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new { Token = tokenReal, Mensaje = $"Bienvenido al panel, {coach.Nombre}." });
        }

        [HttpPost("olvide-password")]
        public async Task<IActionResult> OlvidePassword([FromBody] OlvidePasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || !EsEmailValido(request.Email))
            {
                return BadRequest(new { Error = "El correo no tiene un formato válido." });
            }

            var coach = await _usuarioRepository.ObtenerPorEmailAsync(request.Email);

            // Respuesta genérica: no revelamos si el correo existe o no en el sistema
            if (coach != null)
            {
                string pin = Random.Shared.Next(100000, 1000000).ToString();

                coach.ResetPinHash = BCrypt.Net.BCrypt.HashPassword(pin);
                coach.ResetPinExpiracion = DateTime.UtcNow.AddMinutes(MinutosValidezPin);
                await _usuarioRepository.ActualizarAsync(coach);

                string cuerpo = $@"
                    <div style='font-family:sans-serif;'>
                        <h2 style='color:#e53935;'>DojoFlow</h2>
                        <p>Hola {coach.Nombre}, tu PIN para restablecer la contraseña es:</p>
                        <p style='font-size:28px; font-weight:bold; letter-spacing:4px;'>{pin}</p>
                        <p>Este PIN es válido por {MinutosValidezPin} minutos. Si tú no solicitaste este cambio, ignora este correo.</p>
                    </div>";

                await _emailSender.EnviarAsync(coach.Email, "Recuperación de contraseña - DojoFlow", cuerpo);
            }

            return Ok(new { Mensaje = "Si el correo está registrado, te enviamos un PIN para restablecer tu contraseña." });
        }

        [HttpGet("verificar-correo")]
        public async Task<IActionResult> VerificarCorreo([FromQuery] string token)
        {
            var coach = string.IsNullOrWhiteSpace(token)
                ? null
                : await _usuarioRepository.ObtenerPorTokenVerificacionAsync(token);

            if (coach == null)
            {
                return ContentHtml(PaginaVerificacion("Link inválido", "Este link de verificación no es válido o ya fue usado.", exito: false));
            }

            coach.EmailVerificado = true;
            coach.TokenVerificacion = null;
            await _usuarioRepository.ActualizarAsync(coach);

            return ContentHtml(PaginaVerificacion("¡Correo verificado!", $"Listo, {coach.Nombre}. Ya puedes iniciar sesión en DojoFlow.", exito: true));
        }

        [HttpPost("resetear-password")]
        public async Task<IActionResult> ResetearPassword([FromBody] ResetearPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Pin) || string.IsNullOrWhiteSpace(request.NuevaPassword))
            {
                return BadRequest(new { Error = "Correo, PIN y nueva contraseña son obligatorios." });
            }

            if (request.NuevaPassword.Length < 6)
            {
                return BadRequest(new { Error = "La nueva contraseña debe tener al menos 6 caracteres." });
            }

            var coach = await _usuarioRepository.ObtenerPorEmailAsync(request.Email);

            bool pinValido = coach?.ResetPinHash != null
                && coach.ResetPinExpiracion.HasValue
                && coach.ResetPinExpiracion.Value > DateTime.UtcNow
                && BCrypt.Net.BCrypt.Verify(request.Pin, coach.ResetPinHash);

            if (coach == null || !pinValido)
            {
                return BadRequest(new { Error = "El PIN es inválido o ya expiró. Solicita uno nuevo." });
            }

            coach.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaPassword);
            coach.ResetPinHash = null;
            coach.ResetPinExpiracion = null;
            await _usuarioRepository.ActualizarAsync(coach);

            return Ok(new { Mensaje = "Contraseña actualizada correctamente. Ya puedes iniciar sesión." });
        }

        private static bool EsEmailValido(string email)
        {
            try
            {
                _ = new MailAddress(email);
                return true;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        private ContentResult ContentHtml(string html)
        {
            return Content(html, "text/html");
        }

        private static string PaginaVerificacion(string titulo, string mensaje, bool exito)
        {
            string color = exito ? "#4CAF50" : "#e53935";
            return $@"
                <!DOCTYPE html>
                <html lang='es'>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <title>DojoFlow - Verificación</title>
                    <style>
                        body {{
                            background-color: #121212; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;
                        }}
                        .card {{
                            background-color: #1e1e1e; padding: 2.5rem; border-radius: 8px; text-align: center;
                            box-shadow: 0 8px 24px rgba(0,0,0,0.8); border-top: 4px solid {color}; max-width: 420px;
                        }}
                        h2 {{ color: {color}; text-transform: uppercase; letter-spacing: 2px; }}
                        a {{
                            display: inline-block; margin-top: 1.5rem; background-color: #e53935; color: #ffffff;
                            padding: 0.8rem 1.6rem; border-radius: 4px; text-decoration: none; font-weight: bold; text-transform: uppercase;
                        }}
                    </style>
                </head>
                <body>
                    <div class='card'>
                        <h2>{titulo}</h2>
                        <p>{mensaje}</p>
                        <a href='/login.html'>Ir al login</a>
                    </div>
                </body>
                </html>";
        }
    }

    public class RegistroRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class OlvidePasswordRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ResetearPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Pin { get; set; } = string.Empty;
        public string NuevaPassword { get; set; } = string.Empty;
    }
}
