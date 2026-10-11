using DojoFlow.Domain.Entities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DojoFlow.API.Services
{
    public class GeneradorTokens
    {
        private readonly IConfiguration _config;

        public GeneradorTokens(IConfiguration config)
        {
            _config = config;
        }

        public string ParaUsuario(UsuarioCoach usuario)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.Email),
                new Claim("nombre", usuario.Nombre),
                new Claim("id", usuario.Id.ToString()),
                new Claim(TenantContextHttp.ClaimAcademia, usuario.AcademiaId.ToString()),
                new Claim(ClaimTypes.Role, usuario.Rol)
            };
            return Crear(claims, TimeSpan.FromDays(7));
        }

        // Token de larga duración para la tablet de recepción: solo sirve para registrar asistencias
        public string ParaKiosco(Guid academiaId)
        {
            var claims = new[]
            {
                new Claim(TenantContextHttp.ClaimAcademia, academiaId.ToString()),
                new Claim(ClaimTypes.Role, Roles.Kiosco)
            };
            return Crear(claims, TimeSpan.FromDays(365));
        }

        private string Crear(IEnumerable<Claim> claims, TimeSpan vigencia)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.Add(vigencia),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
