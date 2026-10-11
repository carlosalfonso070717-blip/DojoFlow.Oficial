using DojoFlow.API.Services;
using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Academias;
using DojoFlow.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Mail;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private const int MinutosValidezPin = 15;

        private readonly IUsuarioCoachRepository _usuarioRepository;
        private readonly IVerificacionEmailRepository _verificacionRepository;
        private readonly IAcademiaRepository _academiaRepository;
        private readonly IEmailSender _emailSender;
        private readonly RegistrarAcademiaUseCase _registrarAcademia;
        private readonly GeneradorTokens _tokens;

        public AuthController(
            IUsuarioCoachRepository usuarioRepository,
            IVerificacionEmailRepository verificacionRepository,
            IAcademiaRepository academiaRepository,
            IEmailSender emailSender,
            RegistrarAcademiaUseCase registrarAcademia,
            GeneradorTokens tokens)
        {
            _usuarioRepository = usuarioRepository;
            _verificacionRepository = verificacionRepository;
            _academiaRepository = academiaRepository;
            _emailSender = emailSender;
            _registrarAcademia = registrarAcademia;
            _tokens = tokens;
        }

        [HttpPost("enviar-verificacion")]
        public async Task<IActionResult> EnviarVerificacion([FromBody] EnviarVerificacionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || !EsEmailValido(request.Email))
            {
                return BadRequest(new { Error = "El correo no tiene un formato válido." });
            }

            string email = request.Email.Trim().ToLowerInvariant();

            if (await _usuarioRepository.ObtenerPorEmailAsync(email) != null)
            {
                return BadRequest(new { Error = "Ya existe una cuenta registrada con ese correo." });
            }

            string pin = Random.Shared.Next(100000, 1000000).ToString();

            var verificacion = await _verificacionRepository.ObtenerPorEmailAsync(email) ?? new VerificacionEmail { Email = email };
            verificacion.PinHash = BCrypt.Net.BCrypt.HashPassword(pin);
            verificacion.Expiracion = DateTime.UtcNow.AddMinutes(MinutosValidezPin);
            verificacion.Verificado = false;
            await _verificacionRepository.GuardarAsync(verificacion);

            string cuerpo = $@"
                <div style='font-family:sans-serif;'>
                    <h2 style='color:#e53935;'>DojoFlow</h2>
                    <p>Tu código para verificar tu correo es:</p>
                    <p style='font-size:28px; font-weight:bold; letter-spacing:4px;'>{pin}</p>
                    <p>Este código es válido por {MinutosValidezPin} minutos.</p>
                </div>";

            await _emailSender.EnviarAsync(email, "Verifica tu correo - DojoFlow", cuerpo);

            return Ok(new { Mensaje = "Te enviamos un código de verificación a tu correo." });
        }

        [HttpPost("confirmar-verificacion")]
        public async Task<IActionResult> ConfirmarVerificacion([FromBody] ConfirmarVerificacionRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Pin))
            {
                return BadRequest(new { Error = "Correo y código son obligatorios." });
            }

            string email = request.Email.Trim().ToLowerInvariant();
            var verificacion = await _verificacionRepository.ObtenerPorEmailAsync(email);

            bool pinValido = verificacion != null
                && verificacion.Expiracion > DateTime.UtcNow
                && BCrypt.Net.BCrypt.Verify(request.Pin, verificacion.PinHash);

            if (verificacion == null || !pinValido)
            {
                return BadRequest(new { Error = "El código es inválido o ya expiró. Solicita uno nuevo." });
            }

            verificacion.Verificado = true;
            await _verificacionRepository.GuardarAsync(verificacion);

            return Ok(new { Mensaje = "Correo verificado correctamente." });
        }

        // Registro público: crea una academia nueva y a su dueño (requiere correo verificado)
        [HttpPost("signup")]
        public async Task<IActionResult> RegistrarAcademia([FromBody] RegistroRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { Error = "El nombre, correo y contraseña son obligatorios." });
            }

            if (string.IsNullOrWhiteSpace(request.NombreAcademia))
            {
                return BadRequest(new { Error = "El nombre de tu academia es obligatorio." });
            }

            if (!EsEmailValido(request.Email))
            {
                return BadRequest(new { Error = "El correo no tiene un formato válido." });
            }

            if (request.Password.Length < 6)
            {
                return BadRequest(new { Error = "La contraseña debe tener al menos 6 caracteres." });
            }

            string email = request.Email.Trim().ToLowerInvariant();

            if (await _usuarioRepository.ObtenerPorEmailAsync(email) != null)
            {
                return BadRequest(new { Error = "Ya existe una cuenta registrada con ese correo." });
            }

            var verificacion = await _verificacionRepository.ObtenerPorEmailAsync(email);
            if (verificacion == null || !verificacion.Verificado)
            {
                return BadRequest(new { Error = "Primero debes verificar tu correo con el código que te enviamos." });
            }

            Academia academia;
            UsuarioCoach dueno;
            try
            {
                (academia, dueno) = await _registrarAcademia.EjecutarAsync(new RegistrarAcademiaComando(
                    request.NombreAcademia,
                    request.TipoNegocio,
                    request.Nombre,
                    email,
                    BCrypt.Net.BCrypt.HashPassword(request.Password),
                    request.ColorPrimario,
                    request.ColorSecundario,
                    request.TerminoAlumno,
                    request.Clases?.Select(c => new ClaseInicial(c.Nombre, c.Precio)).ToList()));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }

            await _verificacionRepository.EliminarAsync(verificacion);

            // Se devuelve el token para entrar directo al onboarding, sin pasar por el login
            return Ok(new
            {
                Mensaje = $"¡Bienvenido a DojoFlow! {academia.Nombre} está lista.",
                Token = _tokens.ParaUsuario(dueno)
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> IniciarSesion([FromBody] LoginRequest request)
        {
            var coach = await _usuarioRepository.ObtenerPorEmailAsync(request.Email);

            if (coach == null || !BCrypt.Net.BCrypt.Verify(request.Password, coach.PasswordHash))
            {
                return Unauthorized(new { Error = "Correo o contraseña incorrectos." });
            }

            return Ok(new { Token = _tokens.ParaUsuario(coach), Mensaje = $"Bienvenido al panel, {coach.Nombre}." });
        }

        // Datos del usuario y de su academia para personalizar la app al abrirla
        [Authorize]
        [HttpGet("yo")]
        public async Task<IActionResult> ObtenerPerfil()
        {
            var usuario = await ObtenerUsuarioActualAsync();
            if (usuario == null) return Unauthorized();

            var academia = await _academiaRepository.ObtenerPorIdAsync(usuario.AcademiaId);
            if (academia == null) return Unauthorized();

            return Ok(new
            {
                Usuario = new { usuario.Id, usuario.Nombre, usuario.Email, usuario.Rol, usuario.TourCompletado },
                Academia = AcademiaController.AMarca(academia)
            });
        }

        [Authorize]
        [HttpPost("tour-completado")]
        public async Task<IActionResult> MarcarTourCompletado()
        {
            var usuario = await ObtenerUsuarioActualAsync();
            if (usuario == null) return Unauthorized();

            usuario.TourCompletado = true;
            await _usuarioRepository.ActualizarAsync(usuario);
            return Ok(new { Mensaje = "Tour completado." });
        }

        private async Task<UsuarioCoach?> ObtenerUsuarioActualAsync()
        {
            var id = User.FindFirst("id")?.Value;
            return Guid.TryParse(id, out var usuarioId) ? await _usuarioRepository.ObtenerPorIdAsync(usuarioId) : null;
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
    }

    public class EnviarVerificacionRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ConfirmarVerificacionRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Pin { get; set; } = string.Empty;
    }

    public class RegistroRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string NombreAcademia { get; set; } = string.Empty;
        public string TipoNegocio { get; set; } = string.Empty;

        // Opcionales: personalización elegida en el asistente de registro de la app
        public string? ColorPrimario { get; set; }
        public string? ColorSecundario { get; set; }
        public string? TerminoAlumno { get; set; }
        public List<ClaseRegistroRequest>? Clases { get; set; }
    }

    public class ClaseRegistroRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public decimal Precio { get; set; }
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
