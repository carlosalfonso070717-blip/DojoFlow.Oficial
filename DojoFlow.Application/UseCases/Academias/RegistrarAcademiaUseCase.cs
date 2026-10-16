using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.UseCases.Academias
{
    public record ClaseInicial(string Nombre, decimal Precio);

    public record SucursalInicial(string Nombre, string? Direccion = null, string? Telefono = null);

    // Lo que no se mande (colores, término, clases) se toma de la plantilla del tipo de negocio.
    // Con Sucursales, la academia nace con varias sedes: NombreSucursal es el de la principal.
    public record RegistrarAcademiaComando(
        string NombreAcademia,
        string TipoNegocio,
        string NombreDueno,
        string Email,
        string PasswordHash,
        string? ColorPrimario = null,
        string? ColorSecundario = null,
        string? TerminoAlumno = null,
        IReadOnlyList<ClaseInicial>? Clases = null,
        string? NombreSucursal = null,
        IReadOnlyList<SucursalInicial>? Sucursales = null);

    public class RegistrarAcademiaUseCase
    {
        public const string NombreSucursalPrincipal = "Principal";

        private readonly IAcademiaRepository _academiaRepository;

        public RegistrarAcademiaUseCase(IAcademiaRepository academiaRepository)
        {
            _academiaRepository = academiaRepository;
        }

        public async Task<(Academia Academia, UsuarioCoach Dueno)> EjecutarAsync(RegistrarAcademiaComando comando)
        {
            if (string.IsNullOrWhiteSpace(comando.NombreAcademia))
                throw new ArgumentException("El nombre de la academia es obligatorio.");

            var plantilla = PlantillasAcademia.Para(comando.TipoNegocio);
            var ahora = DateTime.UtcNow;

            var academia = new Academia
            {
                Id = Guid.NewGuid(),
                TipoNegocio = plantilla.TipoNegocio,
                ModoCobro = ModoCobro.PorClase,
                FechaCreacion = ahora
            };
            // Valida colores y nombre con las mismas reglas que Ajustes
            academia.ActualizarMarca(
                comando.NombreAcademia,
                comando.ColorPrimario ?? plantilla.ColorPrimario,
                comando.ColorSecundario ?? plantilla.ColorSecundario,
                comando.TerminoAlumno ?? plantilla.TerminoAlumno);

            var academias = new List<Academia> { academia };
            var otras = comando.Sucursales?.Where(s => !string.IsNullOrWhiteSpace(s.Nombre)).ToList() ?? new();
            if (otras.Count > 0)
            {
                academia.SucursalesActivas = true;
                academia.ActualizarDatosSucursal(
                    string.IsNullOrWhiteSpace(comando.NombreSucursal) ? NombreSucursalPrincipal : comando.NombreSucursal,
                    null,
                    null);

                var nombres = otras.Select(s => s.Nombre.Trim()).Append(academia.NombreSucursal!);
                var repetida = nombres.GroupBy(n => n, StringComparer.OrdinalIgnoreCase).FirstOrDefault(g => g.Count() > 1);
                if (repetida != null)
                    throw new ArgumentException($"La sucursal '{repetida.Key}' está repetida.");

                // Un milisegundo de diferencia para que el orden de la lista sea el mismo en que se capturaron
                academias.AddRange(otras.Select((s, i) => academia.CrearSucursal(s.Nombre, s.Direccion, s.Telefono, ahora.AddMilliseconds(i + 1))));
            }

            var clasesIniciales = comando.Clases
                ?? plantilla.ClasesSugeridas.Select(nombre => new ClaseInicial(nombre, 0m)).ToList();

            var repetidas = clasesIniciales
                .GroupBy(c => c.Nombre.Trim(), StringComparer.OrdinalIgnoreCase)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();
            if (repetidas.Count > 0)
                throw new ArgumentException($"La clase '{repetidas[0]}' está repetida.");

            // Cada sede arranca con las mismas clases; después cada una ajusta las suyas
            var clases = academias
                .SelectMany(a => clasesIniciales.Select(c => new Clase(c.Nombre, c.Precio) { AcademiaId = a.Id }))
                .ToList();

            var dueno = new UsuarioCoach
            {
                Id = Guid.NewGuid(),
                Nombre = comando.NombreDueno.Trim(),
                Email = comando.Email.Trim().ToLowerInvariant(),
                PasswordHash = comando.PasswordHash,
                AcademiaId = academia.Id,
                Rol = Roles.Dueno
            };

            await _academiaRepository.RegistrarAsync(academias, clases, dueno);
            return (academia, dueno);
        }
    }
}
