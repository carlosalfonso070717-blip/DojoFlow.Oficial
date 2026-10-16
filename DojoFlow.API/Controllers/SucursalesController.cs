using DojoFlow.API.Services;
using DojoFlow.Application.Interfaces;
using DojoFlow.Application.UseCases.Academias;
using DojoFlow.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    public class SucursalRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
    }

    // Sedes de un mismo negocio. Cada una es una academia con sus propios datos; la sesión
    // trabaja en una a la vez y el dueño cambia de sede pidiendo un token nuevo.
    [Authorize(Roles = Roles.Dueno)]
    [ApiController]
    [Route("api/[controller]")]
    public class SucursalesController : ControllerBase
    {
        private const int MaximoSucursales = 20;

        private readonly IAcademiaRepository _academiaRepository;
        private readonly IClaseRepository _claseRepository;
        private readonly IUsuarioCoachRepository _usuarioRepository;
        private readonly ITenantContext _tenant;
        private readonly GeneradorTokens _tokens;

        public SucursalesController(
            IAcademiaRepository academiaRepository,
            IClaseRepository claseRepository,
            IUsuarioCoachRepository usuarioRepository,
            ITenantContext tenant,
            GeneradorTokens tokens)
        {
            _academiaRepository = academiaRepository;
            _claseRepository = claseRepository;
            _usuarioRepository = usuarioRepository;
            _tenant = tenant;
            _tokens = tokens;
        }

        private object ASucursal(Academia a) => new
        {
            a.Id,
            Nombre = a.NombreSucursal ?? a.Nombre,
            a.Direccion,
            a.Telefono,
            EsPrincipal = a.MatrizId == null,
            Actual = a.Id == _tenant.AcademiaId
        };

        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var actual = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (actual == null) return NotFound();

            var sedes = await _academiaRepository.ObtenerGrupoAsync(actual.GrupoId);
            return Ok(sedes.Select(ASucursal));
        }

        // Nueva sede: hereda marca, forma de cobro y las clases activas de la sede actual
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] SucursalRequest request)
        {
            var actual = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (actual == null) return NotFound();

            var sedes = await _academiaRepository.ObtenerGrupoAsync(actual.GrupoId);
            if (sedes.Count >= MaximoSucursales)
                return BadRequest(new { Error = $"Puedes tener hasta {MaximoSucursales} sucursales." });
            if (NombreRepetido(sedes, request.Nombre, null))
                return BadRequest(new { Error = "Ya tienes una sucursal con ese nombre." });

            Academia sucursal;
            try
            {
                sucursal = actual.CrearSucursal(request.Nombre, request.Direccion, request.Telefono, DateTime.UtcNow);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }

            var clases = (await _claseRepository.ObtenerTodasAsync())
                .Where(c => c.Activa)
                .Select(c => new Clase(c.Nombre, c.Precio) { AcademiaId = sucursal.Id })
                .ToList();

            await _academiaRepository.AgregarSucursalAsync(sucursal, clases);

            // Crear una sede enciende el manejo de sucursales en todo el negocio
            var pendientes = sedes.Where(s => !s.SucursalesActivas || string.IsNullOrWhiteSpace(s.NombreSucursal)).ToList();
            foreach (var sede in pendientes)
            {
                sede.SucursalesActivas = true;
                sede.NombreSucursal ??= RegistrarAcademiaUseCase.NombreSucursalPrincipal;
            }
            if (pendientes.Count > 0) await _academiaRepository.ActualizarAsync(pendientes);

            return Ok(ASucursal(sucursal));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] SucursalRequest request)
        {
            var (sede, sedes) = await BuscarEnMiNegocioAsync(id);
            if (sede == null) return NotFound(new { Error = "Esa sucursal no es de tu negocio." });
            if (NombreRepetido(sedes, request.Nombre, id))
                return BadRequest(new { Error = "Ya tienes una sucursal con ese nombre." });

            try
            {
                sede.ActualizarDatosSucursal(request.Nombre, request.Direccion, request.Telefono);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }

            await _academiaRepository.ActualizarAsync(sede);
            return Ok(ASucursal(sede));
        }

        // Borra una sede con todos sus datos. No se puede borrar la principal (de ella cuelgan las demás)
        // ni la sede en la que está la sesión, ni una sede con cuentas propias del panel.
        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id)
        {
            var (sede, _) = await BuscarEnMiNegocioAsync(id);
            if (sede == null) return NotFound(new { Error = "Esa sucursal no es de tu negocio." });
            if (sede.MatrizId == null)
                return BadRequest(new { Error = "La sucursal principal no se puede borrar." });
            if (sede.Id == _tenant.AcademiaId)
                return BadRequest(new { Error = "Cámbiate a otra sucursal antes de borrar esta." });
            if (await _usuarioRepository.ExisteEnAcademiaAsync(sede.Id))
                return BadRequest(new { Error = "Esta sucursal tiene cuentas del panel propias; no se puede borrar." });

            await _academiaRepository.EliminarAsync(sede);
            return Ok(new { Mensaje = $"Se borró la sucursal {sede.NombreSucursal}." });
        }

        // Cambia la sede de la sesión: devuelve un token nuevo que apunta a la sucursal elegida
        [HttpPost("{id}/cambiar")]
        public async Task<IActionResult> Cambiar(Guid id)
        {
            var usuario = Guid.TryParse(User.FindFirst("id")?.Value, out var usuarioId)
                ? await _usuarioRepository.ObtenerPorIdAsync(usuarioId)
                : null;
            if (usuario == null) return Unauthorized();

            // Se compara contra la academia del usuario (no la de la sesión) por si el token es viejo
            var casa = await _academiaRepository.ObtenerPorIdAsync(usuario.AcademiaId);
            var destino = await _academiaRepository.ObtenerPorIdAsync(id);
            if (casa == null || destino == null || destino.GrupoId != casa.GrupoId)
                return NotFound(new { Error = "Esa sucursal no es de tu negocio." });

            return Ok(new { Token = _tokens.ParaUsuario(usuario, destino.Id), Sucursal = ASucursal(destino) });
        }

        private async Task<(Academia? Sede, List<Academia> Sedes)> BuscarEnMiNegocioAsync(Guid id)
        {
            var actual = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (actual == null) return (null, new());
            var sedes = await _academiaRepository.ObtenerGrupoAsync(actual.GrupoId);
            return (sedes.FirstOrDefault(s => s.Id == id), sedes);
        }

        private static bool NombreRepetido(IEnumerable<Academia> sedes, string nombre, Guid? excepto) =>
            sedes.Any(s => s.Id != excepto && string.Equals(s.NombreSucursal?.Trim(), nombre?.Trim(), StringComparison.OrdinalIgnoreCase));
    }
}
