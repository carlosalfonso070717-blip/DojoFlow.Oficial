using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.UseCases.Academias
{
    public record ClaseInicial(string Nombre, decimal Precio);

    // Lo que no se mande (colores, término, clases) se toma de la plantilla del tipo de negocio
    public record RegistrarAcademiaComando(
        string NombreAcademia,
        string TipoNegocio,
        string NombreDueno,
        string Email,
        string PasswordHash,
        string? ColorPrimario = null,
        string? ColorSecundario = null,
        string? TerminoAlumno = null,
        IReadOnlyList<ClaseInicial>? Clases = null);

    public class RegistrarAcademiaUseCase
    {
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

            var academia = new Academia
            {
                Id = Guid.NewGuid(),
                TipoNegocio = plantilla.TipoNegocio,
                ModoCobro = ModoCobro.PorClase,
                FechaCreacion = DateTime.UtcNow
            };
            // Valida colores y nombre con las mismas reglas que Ajustes
            academia.ActualizarMarca(
                comando.NombreAcademia,
                comando.ColorPrimario ?? plantilla.ColorPrimario,
                comando.ColorSecundario ?? plantilla.ColorSecundario,
                comando.TerminoAlumno ?? plantilla.TerminoAlumno);

            var clasesIniciales = comando.Clases
                ?? plantilla.ClasesSugeridas.Select(nombre => new ClaseInicial(nombre, 0m)).ToList();

            var repetidas = clasesIniciales
                .GroupBy(c => c.Nombre.Trim(), StringComparer.OrdinalIgnoreCase)
                .Where(g => g.Count() > 1)
                .Select(g => g.Key)
                .ToList();
            if (repetidas.Count > 0)
                throw new ArgumentException($"La clase '{repetidas[0]}' está repetida.");

            var clases = clasesIniciales
                .Select(c => new Clase(c.Nombre, c.Precio) { AcademiaId = academia.Id })
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

            await _academiaRepository.RegistrarAsync(academia, clases, dueno);
            return (academia, dueno);
        }
    }
}
