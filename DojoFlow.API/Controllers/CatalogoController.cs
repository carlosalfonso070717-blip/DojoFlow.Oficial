using System.Globalization;
using System.Net;
using System.Text;
using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DojoFlow.API.Controllers
{
    // Catálogo de productos que la academia comparte con sus alumnos mediante un enlace público
    [ApiController]
    public class CatalogoController : ControllerBase
    {
        private static readonly CultureInfo Mx = CultureInfo.GetCultureInfo("es-MX");

        private readonly IAcademiaRepository _academiaRepository;
        private readonly IProductoRepository _productoRepository;
        private readonly ITenantContext _tenant;
        private readonly IConfiguration _config;

        public CatalogoController(IAcademiaRepository academiaRepository, IProductoRepository productoRepository, ITenantContext tenant, IConfiguration config)
        {
            _academiaRepository = academiaRepository;
            _productoRepository = productoRepository;
            _tenant = tenant;
            _config = config;
        }

        // ===== Panel: obtener o regenerar el enlace =====

        // Devuelve el enlace del catálogo; si la academia aún no tiene uno, lo crea
        [Authorize]
        [HttpPost("api/Catalogo/enlace")]
        public async Task<IActionResult> ObtenerEnlace()
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return Unauthorized();

            if (academia.CodigoCatalogo == null)
            {
                academia.RenovarCodigoCatalogo();
                await _academiaRepository.ActualizarAsync(academia);
            }
            return Ok(new { Url = UrlCatalogo(academia.CodigoCatalogo!) });
        }

        // Cambia el enlace: el anterior deja de funcionar
        [Authorize(Roles = Roles.Dueno)]
        [HttpPost("api/Catalogo/enlace/renovar")]
        public async Task<IActionResult> RenovarEnlace()
        {
            var academia = await _academiaRepository.ObtenerPorIdAsync(_tenant.AcademiaId);
            if (academia == null) return Unauthorized();

            academia.RenovarCodigoCatalogo();
            await _academiaRepository.ActualizarAsync(academia);
            return Ok(new { Url = UrlCatalogo(academia.CodigoCatalogo!) });
        }

        // ===== Público =====

        [AllowAnonymous]
        [HttpGet("api/Catalogo/{codigo}")]
        public async Task<IActionResult> ObtenerCatalogo(string codigo)
        {
            var academia = await _academiaRepository.ObtenerPorCodigoCatalogoAsync(codigo);
            if (academia == null) return NotFound(new { Error = "Este catálogo no existe o el enlace cambió." });

            var productos = await _productoRepository.ObtenerCatalogoAsync(academia.Id);
            return Ok(new
            {
                Academia = new { academia.Nombre, academia.ColorPrimario, academia.ColorSecundario, academia.Moneda, LogoUrl = LogoUrl(academia) },
                Productos = productos.Select(p => new { p.Id, p.Nombre, p.Precio, Disponible = p.StockActual > 0 })
            });
        }

        // La página que ven los alumnos: HTML ligero, sin JavaScript, legible en cualquier celular
        [AllowAnonymous]
        [HttpGet("catalogo/{codigo}")]
        [ResponseCache(Duration = 60)]
        public async Task<IActionResult> PaginaCatalogo(string codigo)
        {
            var academia = await _academiaRepository.ObtenerPorCodigoCatalogoAsync(codigo);
            if (academia == null)
                return Content(Pagina("Catálogo no disponible", "#151619", null, "<p class=\"vacio\">Este catálogo no existe o la academia cambió el enlace. Pide el enlace nuevo en recepción.</p>", null), "text/html; charset=utf-8");

            var productos = await _productoRepository.ObtenerCatalogoAsync(academia.Id);
            var tarjetas = new StringBuilder();
            foreach (var p in productos)
            {
                bool disponible = p.StockActual > 0;
                string? foto = UrlImagen(p.ImagenUrl);
                string miniatura = foto != null
                    ? $"<img class=\"foto\" src=\"{Html(foto)}\" alt=\"\" loading=\"lazy\">"
                    : "<span class=\"foto vacia\" aria-hidden=\"true\"></span>";
                tarjetas.Append($@"
      <li class=""producto"">
        {miniatura}
        <div class=""info"">
          <span class=""nombre"">{Html(p.Nombre)}</span>
          <span class=""estado {(disponible ? "si" : "no")}"">{(disponible ? "Disponible" : "Agotado")}</span>
        </div>
        <span class=""precio{(p.Precio > 0 ? "" : " sin")}"">{(p.Precio > 0 ? Html(p.Precio.ToString("C2", Mx)) : "Pregunta en recepción")}</span>
      </li>");
            }

            string contenido = productos.Count == 0
                ? "<p class=\"vacio\">Todavía no hay productos en el catálogo.</p>"
                : $"<ul class=\"lista\">{tarjetas}\n    </ul>";

            return Content(Pagina(academia.Nombre, academia.ColorPrimario, LogoUrl(academia), contenido, academia), "text/html; charset=utf-8");
        }

        private string? LogoUrl(Academia a) =>
            a.Logo == null ? null : $"{UrlBase()}/api/Academia/{a.Id}/logo?v={a.LogoVersion}";

        // Fotos subidas a la API (ruta relativa) o enlaces externos guardados por la web anterior
        private string? UrlImagen(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return null;
            if (url.StartsWith('/')) return UrlBase() + url;
            return url.StartsWith("https://") || url.StartsWith("http://") ? url : null;
        }

        private string UrlCatalogo(string codigo) => $"{UrlBase()}/catalogo/{codigo}";

        // En Render la petición llega por http detrás del proxy: el enlace público siempre es https
        private string UrlBase()
        {
            var configurada = _config["App:UrlPublica"];
            if (!string.IsNullOrWhiteSpace(configurada)) return configurada.TrimEnd('/');
            var host = Request.Host.Value ?? "dojoflow.club";
            bool local = host.StartsWith("localhost") || host.StartsWith("127.") || host.StartsWith("192.168.") || host.StartsWith("10.");
            return $"{(local ? "http" : "https")}://{host}";
        }

        private static string Html(string texto) => WebUtility.HtmlEncode(texto);

        private static string Pagina(string titulo, string acento, string? logo, string contenido, Academia? academia)
        {
            string t = Html(titulo);
            string color = Academia.EsColorValido(acento) ? acento : "#151619";
            string iniciales = Html(string.Concat(titulo.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(p => char.ToUpper(p[0]))));
            string marca = logo != null
                ? $"<img class=\"logo\" src=\"{Html(logo)}\" alt=\"Logo de {t}\">"
                : $"<span class=\"logo iniciales\">{iniciales}</span>";
            string og = academia == null ? "" : $@"
  <meta property=""og:title"" content=""Catálogo de {t}"">
  <meta property=""og:description"" content=""Productos disponibles en {t}"">
  {(logo != null ? $"<meta property=\"og:image\" content=\"{Html(logo)}\">" : "")}";

            return $@"<!doctype html>
<html lang=""es"">
<head>
  <meta charset=""utf-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
  <title>Catálogo · {t}</title>{og}
  <style>
    :root {{ --acento: {color}; --tinta: #151619; --suave: #5b5e66; --fondo: #f4f4f5; --superficie: #ffffff; --borde: #e4e4e7; }}
    @media (prefers-color-scheme: dark) {{
      :root {{ --tinta: #f2f2f3; --suave: #a1a4ab; --fondo: #0e0f12; --superficie: #17181c; --borde: #2a2c32; }}
    }}
    * {{ box-sizing: border-box; margin: 0; }}
    body {{ background: var(--fondo); color: var(--tinta); font: 16px/1.5 -apple-system, ""Segoe UI"", Roboto, Helvetica, Arial, sans-serif; padding: 32px 16px 48px; }}
    main {{ max-width: 640px; margin: 0 auto; }}
    header {{ display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }}
    .logo {{ width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 2px solid var(--acento); flex: none; }}
    .iniciales {{ display: grid; place-items: center; font-weight: 700; color: var(--acento); background: var(--superficie); }}
    h1 {{ font-size: 26px; line-height: 1.15; letter-spacing: -0.5px; }}
    .sub {{ color: var(--suave); font-size: 15px; }}
    .lista {{ list-style: none; padding: 0; background: var(--superficie); border: 1px solid var(--borde); border-radius: 18px; overflow: hidden; }}
    .producto {{ display: grid; grid-template-columns: 56px 1fr auto; align-items: center; gap: 14px; padding: 14px 18px; border-top: 1px solid var(--borde); }}
    .foto {{ width: 56px; height: 56px; border-radius: 12px; object-fit: cover; background: var(--fondo); display: block; }}
    .foto.vacia {{ background: linear-gradient(135deg, var(--fondo), var(--borde)); }}
    .info {{ display: grid; gap: 2px; min-width: 0; }}
    .producto:first-child {{ border-top: 0; }}
    .nombre {{ font-weight: 600; }}
    .precio {{ font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }}
    .precio.sin {{ font-weight: 500; font-size: 14px; color: var(--suave); }}
    .estado {{ font-size: 13px; color: var(--suave); }}
    .estado.si::before {{ content: """"; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #1f9d6b; margin-right: 6px; }}
    .estado.no {{ text-decoration: line-through; }}
    .vacio {{ color: var(--suave); background: var(--superficie); border: 1px solid var(--borde); border-radius: 18px; padding: 24px; }}
    footer {{ color: var(--suave); font-size: 14px; margin-top: 24px; }}
    .barra {{ height: 4px; width: 48px; border-radius: 4px; background: var(--acento); margin-bottom: 24px; }}
  </style>
</head>
<body>
  <main>
    <div class=""barra""></div>
    <header>
      {marca}
      <div><h1>{t}</h1><p class=""sub"">Catálogo de productos</p></div>
    </header>
    {contenido}
    <footer>Para comprar, pregunta en recepción. Precios y existencias pueden cambiar.</footer>
  </main>
</body>
</html>";
        }
    }
}
