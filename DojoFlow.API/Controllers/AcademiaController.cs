using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    public class ConfigurarAsistenciasRequest
    {
        public bool Activas { get; set; }
    }

    public class ActualizarMarcaRequest
    {
        public string Nombre { get; set; } = string.Empty;
        public string ColorPrimario { get; set; } = string.Empty;
        public string ColorSecundario { get; set; } = string.Empty;
        public string TerminoAlumno { get; set; } = string.Empty;
    }

    public class ConfigurarCobroRequest
    {
        public ModoCobro ModoCobro { get; set; }
        public List<decimal> PreciosPaquete { get; set; } = new();
        public int DiaVencimiento { get; set; } = 15;
    }

    // Sin [Authorize] a nivel clase: cada acción declara quién puede usarla
    // (la marca la necesita también el kiosco, que no es usuario del panel)
    [ApiController]
    [Route("api/[controller]")]
    public class AcademiaController : ControllerBase
    {
        private const int TamanoMaximoLogo = 1024 * 1024;
        private static readonly string[] TiposLogoPermitidos = { "image/png", "image/jpeg", "image/webp" };

        private readonly IAcademiaRepository _academiaRepository;
        private readonly ITenantContext _tenant;

        public AcademiaController(IAcademiaRepository academiaRepository, ITenantContext tenant)
        {
            _academiaRepository = academiaRepository;
            _tenant = tenant;
        }

        // Lo que necesita cualquier pantalla para pintarse con la identidad de la academia
        public static object AMarca(Academia a) => new
        {
            a.Id,
            a.Nombre,
            a.TipoNegocio,
            a.ColorPrimario,
            a.ColorSecundario,
            a.TerminoAlumno,
            a.Moneda,
            a.AsistenciasActivas,
            LogoUrl = a.Logo == null ? null : $"/api/Academia/{a.Id}/logo?v={a.LogoVersion}"
        };

        // Tipos de negocio para el registro (público)
        [AllowAnonymous]
        [HttpGet("tipos")]
        public IActionResult ObtenerTipos()
        {
            return Ok(PlantillasAcademia.Todas.Select(p => new
            {
                p.TipoNegocio,
                p.TerminoAlumno,
                p.ColorPrimario,
                p.ColorSecundario,
                p.ClasesSugeridas
            }));
        }

        // Marca visible también para la tablet del kiosco
        [Authorize(Roles = Roles.Dueno + "," + Roles.Coach + "," + Roles.Kiosco)]
        [HttpGet("marca")]
        public async Task<IActionResult> ObtenerMarca()
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            return academia == null ? NotFound() : Ok(AMarca(academia));
        }

        // Configuración completa (marca + cobro) para la pantalla de Ajustes
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> ObtenerConfiguracion()
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return NotFound();

            return Ok(new
            {
                Marca = AMarca(academia),
                Cobro = new { academia.ModoCobro, academia.PreciosPaquete, academia.DiaVencimiento }
            });
        }

        [Authorize(Roles = Roles.Dueno)]
        [HttpPut("marca")]
        public async Task<IActionResult> ActualizarMarca([FromBody] ActualizarMarcaRequest request)
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return NotFound();

            try
            {
                academia.ActualizarMarca(request.Nombre, request.ColorPrimario, request.ColorSecundario, request.TerminoAlumno);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }

            await _academiaRepository.ActualizarAsync(academia);
            return Ok(AMarca(academia));
        }

        // Activa o desactiva el registrador de asistencias de la academia
        [Authorize(Roles = Roles.Dueno)]
        [HttpPut("asistencias")]
        public async Task<IActionResult> ConfigurarAsistencias([FromBody] ConfigurarAsistenciasRequest request)
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return NotFound();

            academia.AsistenciasActivas = request.Activas;
            await _academiaRepository.ActualizarAsync(academia);
            return Ok(AMarca(academia));
        }

        [Authorize(Roles = Roles.Dueno)]
        [HttpPut("cobro")]
        public async Task<IActionResult> ConfigurarCobro([FromBody] ConfigurarCobroRequest request)
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return NotFound();

            try
            {
                academia.ConfigurarCobro(request.ModoCobro, request.PreciosPaquete, request.DiaVencimiento);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }

            await _academiaRepository.ActualizarAsync(academia);
            return Ok(new { academia.ModoCobro, academia.PreciosPaquete, academia.DiaVencimiento });
        }

        [Authorize(Roles = Roles.Dueno)]
        [HttpPut("logo")]
        [RequestSizeLimit(TamanoMaximoLogo + 64 * 1024)]
        public async Task<IActionResult> SubirLogo(IFormFile archivo)
        {
            if (archivo == null || archivo.Length == 0)
                return BadRequest(new { Error = "No se recibió ninguna imagen." });
            if (archivo.Length > TamanoMaximoLogo)
                return BadRequest(new { Error = "El logo no puede pesar más de 1 MB." });
            if (!TiposLogoPermitidos.Contains(archivo.ContentType))
                return BadRequest(new { Error = "El logo debe ser PNG, JPG o WEBP." });

            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return NotFound();

            using var memoria = new MemoryStream();
            await archivo.CopyToAsync(memoria);
            academia.CambiarLogo(memoria.ToArray(), archivo.ContentType);

            await _academiaRepository.ActualizarAsync(academia);
            return Ok(AMarca(academia));
        }

        [Authorize(Roles = Roles.Dueno)]
        [HttpDelete("logo")]
        public async Task<IActionResult> QuitarLogo()
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return NotFound();

            academia.QuitarLogo();
            await _academiaRepository.ActualizarAsync(academia);
            return Ok(AMarca(academia));
        }

        // Público para que <img> e <Image> lo carguen sin token; la URL lleva la versión
        // en la query, así que se puede cachear sin miedo a mostrar un logo viejo
        [AllowAnonymous]
        [HttpGet("{id}/logo")]
        [ResponseCache(Duration = 31536000)]
        public async Task<IActionResult> ObtenerLogo(Guid id)
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(id);
            if (academia?.Logo == null) return NotFound();
            return File(academia.Logo, academia.LogoContentType ?? "image/png");
        }
    }
}
