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
        private readonly IImagenRepository _imagenRepository;
        private readonly VerificadorGoogle _google;
        private readonly ITenantContext _tenant;

        public AuthController(
            IUsuarioCoachRepository usuarioRepository,
            IVerificacionEmailRepository verificacionRepository,
            IAcademiaRepository academiaRepository,
            IEmailSender emailSender,
            RegistrarAcademiaUseCase registrarAcademia,
            GeneradorTokens tokens,
            IImagenRepository imagenRepository,
            VerificadorGoogle google,
            ITenantContext tenant)
        {
            _tenant = tenant;
            _google = google;
            _imagenRepository = imagenRepository;
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

            string cuerpo = PlantillasCorreo.Codigo(
                "Verifica tu correo",
                "Escribe este código en GestAcademy para continuar con tu registro.",
                pin,
                MinutosValidezPin);
            await _emailSender.EnviarAsync(email, $"{pin} es tu código de GestAcademy", cuerpo);

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

        // Registro público: crea una academia nueva y a su dueño.
        // Con correo y contraseña requiere el PIN verificado; con Google, el correo ya viene verificado por Google.
        [HttpPost("signup")]
        public async Task<IActionResult> RegistrarAcademia([FromBody] RegistroRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NombreAcademia))
            {
                return BadRequest(new { Error = "El nombre de tu academia es obligatorio." });
            }

            string email;
            string nombre;
            string passwordHash;
            VerificacionEmail? verificacion = null;

            if (!string.IsNullOrWhiteSpace(request.GoogleIdToken) || !string.IsNullOrWhiteSpace(request.GoogleAccessToken))
            {
                var cuenta = await _google.ValidarAsync(request.GoogleIdToken, request.GoogleAccessToken);
                if (cuenta == null)
                {
                    return BadRequest(new { Error = "No pudimos confirmar tu cuenta de Google. Vuelve a intentarlo." });
                }

                email = cuenta.Email;
                nombre = string.IsNullOrWhiteSpace(request.Nombre) ? cuenta.Nombre : request.Nombre.Trim();
                // Sin contraseña: entra con Google (puede crear una después con "¿Olvidaste tu contraseña?")
                passwordHash = string.Empty;
            }
            else
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

                email = request.Email.Trim().ToLowerInvariant();
                nombre = request.Nombre;
                passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

                verificacion = await _verificacionRepository.ObtenerPorEmailAsync(email);
                if (verificacion == null || !verificacion.Verificado)
                {
                    return BadRequest(new { Error = "Primero debes verificar tu correo con el código que te enviamos." });
                }
            }

            if (await _usuarioRepository.ObtenerPorEmailAsync(email) != null)
            {
                return BadRequest(new { Error = "Ya existe una cuenta registrada con ese correo." });
            }

            Academia academia;
            UsuarioCoach dueno;
            try
            {
                (academia, dueno) = await _registrarAcademia.EjecutarAsync(new RegistrarAcademiaComando(
                    request.NombreAcademia,
                    request.TipoNegocio,
                    nombre,
                    email,
                    passwordHash,
                    request.ColorPrimario,
                    request.ColorSecundario,
                    request.TerminoAlumno,
                    request.Clases?.Select(c => new ClaseInicial(c.Nombre, c.Precio)).ToList(),
                    request.NombreSucursal,
                    request.Sucursales?.Select(s => new SucursalInicial(s.Nombre, s.Direccion, s.Telefono)).ToList()));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }

            // También se limpia un PIN pendiente si empezó con correo y terminó con Google
            verificacion ??= await _verificacionRepository.ObtenerPorEmailAsync(email);
            if (verificacion != null) await _verificacionRepository.EliminarAsync(verificacion);

            // Se devuelve el token para entrar directo al onboarding, sin pasar por el login
            return Ok(new
            {
                Mensaje = $"¡Bienvenido a GestAcademy! {academia.Nombre} está lista.",
                Token = _tokens.ParaUsuario(dueno)
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> IniciarSesion([FromBody] LoginRequest request)
        {
            var coach = await _usuarioRepository.ObtenerPorEmailAsync(request.Email);

            // Las cuentas creadas con Google no tienen contraseña hasta que elijan una
            if (coach != null && string.IsNullOrEmpty(coach.PasswordHash))
            {
                return Unauthorized(new { Error = "Esta cuenta entra con Google. Usa \"Continuar con Google\" o crea una contraseña en \"¿Olvidaste tu contraseña?\"." });
            }

            if (coach == null || !BCrypt.Net.BCrypt.Verify(request.Password, coach.PasswordHash))
            {
                return Unauthorized(new { Error = "Correo o contraseña incorrectos." });
            }

            return Ok(new { Token = _tokens.ParaUsuario(coach), Mensaje = $"Bienvenido al panel, {coach.Nombre}." });
        }

        // "Continuar con Google": si el correo ya tiene cuenta, inicia sesión;
        // si no, devuelve sus datos para que la app siga con el registro de la academia
        [HttpPost("google")]
        public async Task<IActionResult> ContinuarConGoogle([FromBody] GoogleRequest request)
        {
            if (!_google.Configurado)
            {
                return BadRequest(new { Error = "El acceso con Google no está disponible por ahora." });
            }

            var cuenta = await _google.ValidarAsync(request.IdToken, request.AccessToken);
            if (cuenta == null)
            {
                return Unauthorized(new { Error = "No pudimos confirmar tu cuenta de Google. Vuelve a intentarlo." });
            }

            var coach = await _usuarioRepository.ObtenerPorEmailAsync(cuenta.Email);
            if (coach == null)
            {
                return Ok(new { Registrado = false, cuenta.Email, cuenta.Nombre });
            }

            return Ok(new
            {
                Registrado = true,
                Token = _tokens.ParaUsuario(coach),
                Mensaje = $"Bienvenido al panel, {coach.Nombre}."
            });
        }

        // Datos del usuario y de su academia para personalizar la app al abrirla
        [Authorize]
        [HttpGet("yo")]
        public async Task<IActionResult> ObtenerPerfil()
        {
            var usuario = await ObtenerUsuarioActualAsync();
            if (usuario == null) return Unauthorized();

            // La sede de la sesión (puede ser otra sucursal del mismo negocio, elegida al cambiar de sucursal)
            var casa = await _academiaRepository.ObtenerPorIdAsync(usuario.AcademiaId);
            if (casa == null) return Unauthorized();
            // Si la sucursal de la sesión ya no existe (se borró desde otro dispositivo), la sesión
            // se cierra y al volver a entrar queda en la principal
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null || academia.GrupoId != casa.GrupoId) return Unauthorized();

            return Ok(new
            {
                Usuario = new { usuario.Id, usuario.Nombre, usuario.Email, usuario.Rol, usuario.TourCompletado, usuario.FotoUrl },
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

        // Foto de perfil del usuario que tiene la sesión
        [Authorize]
        [HttpPut("foto")]
        [RequestSizeLimit(ImagenesController.TamanoMaximo + 64 * 1024)]
        public async Task<IActionResult> SubirFoto(IFormFile archivo)
        {
            var usuario = await ObtenerUsuarioActualAsync();
            if (usuario == null) return Unauthorized();

            var (imagen, error) = await ImagenesController.LeerAsync(archivo);
            if (imagen == null) return BadRequest(new { Error = error });

            await _imagenRepository.AgregarAsync(imagen);
            var anterior = usuario.FotoUrl;
            usuario.FotoUrl = imagen.Url;
            await _usuarioRepository.ActualizarAsync(usuario);
            await _imagenRepository.EliminarPorUrlAsync(anterior);

            return Ok(new { usuario.FotoUrl });
        }

        [Authorize]
        [HttpDelete("foto")]
        public async Task<IActionResult> QuitarFoto()
        {
            var usuario = await ObtenerUsuarioActualAsync();
            if (usuario == null) return Unauthorized();

            var anterior = usuario.FotoUrl;
            usuario.FotoUrl = null;
            await _usuarioRepository.ActualizarAsync(usuario);
            await _imagenRepository.EliminarPorUrlAsync(anterior);

            return Ok(new { usuario.FotoUrl });
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

                string cuerpo = PlantillasCorreo.Codigo(
                    "Restablece tu contraseña",
                    $"Hola {coach.Nombre}, usa este código para elegir una contraseña nueva.",
                    pin,
                    MinutosValidezPin,
                    "Si tú no lo pediste, ignora este correo: tu contraseña no cambia.");
                await _emailSender.EnviarAsync(coach.Email, $"{pin} es tu código para restablecer tu contraseña", cuerpo);
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

        // Si viene alguno, la cuenta se crea con Google: se ignoran Email y Password
        public string? GoogleIdToken { get; set; }
        public string? GoogleAccessToken { get; set; }

        // Opcionales: personalización elegida en el asistente de registro de la app
        public string? ColorPrimario { get; set; }
        public string? ColorSecundario { get; set; }
        public string? TerminoAlumno { get; set; }
        public List<ClaseRegistroRequest>? Clases { get; set; }

        // Si tiene varias sucursales: el nombre de esta (la principal) y los datos de las demás
        public string? NombreSucursal { get; set; }
        public List<SucursalRequest>? Sucursales { get; set; }
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

    // Una de las dos: ID token (app nativa) o access token (web)
    public class GoogleRequest
    {
        public string? IdToken { get; set; }
        public string? AccessToken { get; set; }
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
