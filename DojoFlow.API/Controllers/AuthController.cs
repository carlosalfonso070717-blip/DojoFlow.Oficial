using BCrypt.Net;
using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUsuarioCoachRepository _usuarioRepository;
        private readonly IConfiguration _config;

        public AuthController(IUsuarioCoachRepository usuarioRepository, IConfiguration config)
        {
            _usuarioRepository = usuarioRepository;
            _config = config;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> RegistrarCoach([FromBody] RegistroRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { Error = "El usuario y la contraseña son obligatorios." });
            }

            if (await _usuarioRepository.ObtenerPorUsernameAsync(request.Username) != null)
            {
                return BadRequest(new { Error = "El coach ya está registrado." });
            }

            string hash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var nuevoCoach = new UsuarioCoach
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                PasswordHash = hash
            };

            await _usuarioRepository.AgregarAsync(nuevoCoach);

            return Ok(new { Mensaje = "Coach registrado exitosamente en DojoFlow." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> IniciarSesion([FromBody] LoginRequest request)
        {
            var coach = await _usuarioRepository.ObtenerPorUsernameAsync(request.Username);

            if (coach == null || !BCrypt.Net.BCrypt.Verify(request.Password, coach.PasswordHash))
            {
                return Unauthorized(new { Error = "Usuario o contraseña incorrectos." });
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, coach.Username),
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

            return Ok(new { Token = tokenReal, Mensaje = "Bienvenido al panel, Coach." });
        }
    }

    public class RegistroRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
    public class LoginRequest : RegistroRequest { }
}
