using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using DojoFlow.Domain.Entities;

namespace DojoFlow.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        // Simulamos la tabla de la base de datos para los accesos del coach
        public static List<UsuarioCoach> _usuarios = new List<UsuarioCoach>();
        private readonly IConfiguration _config;

        // Inyectamos IConfiguration para poder leer la llave secreta desde appsettings.json
        public AuthController(IConfiguration config)
        {
            _config = config;
        }

        [HttpPost("signup")]
        public IActionResult RegistrarCoach([FromBody] RegistroRequest request)
        {
            // Validamos que no envíen campos vacíos
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { Error = "El usuario y la contraseña son obligatorios." });
            }

            // Verificamos si el coach ya existe
            if (_usuarios.Any(u => u.Username == request.Username))
            {
                return BadRequest(new { Error = "El coach ya está registrado." });
            }

            // Encriptamos la contraseña de forma segura
            string hash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var nuevoCoach = new UsuarioCoach
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                PasswordHash = hash
            };

            _usuarios.Add(nuevoCoach);

            return Ok(new { Mensaje = "Coach registrado exitosamente en DojoFlow." });
        }

        [HttpPost("login")]
        public IActionResult IniciarSesion([FromBody] LoginRequest request)
        {
            // Buscamos al coach por su usuario
            var coach = _usuarios.FirstOrDefault(u => u.Username == request.Username);

            // Verificamos que exista y que la contraseña coincida con el hash
            if (coach == null || !BCrypt.Net.BCrypt.Verify(request.Password, coach.PasswordHash))
            {
                return Unauthorized(new { Error = "Usuario o contraseña incorrectos." });
            }

            // 1. Traer la llave secreta desde appsettings.json
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // 2. Crear los "Claims" (Datos del usuario que viajan seguros dentro del Token)
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, coach.Username),
                new Claim("id", coach.Id.ToString()),
                new Claim(ClaimTypes.Role, "Coach") // Le asignamos el rol
            };

            // 3. Configurar el Token (En este caso lo hacemos válido por 2 horas)
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: credentials);

            // 4. Generar el string final del JWT
            string tokenReal = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new { Token = tokenReal, Mensaje = "Bienvenido al panel, Coach." });
        }
    }


    public class RegistroRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
    public class LoginRequest : RegistroRequest { }
}