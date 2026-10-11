using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.UseCases.Academias
{
    public record RegistrarAcademiaComando(
        string NombreAcademia,
        string TipoNegocio,
        string NombreDueno,
        string Email,
        string PasswordHash);

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
                Nombre = comando.NombreAcademia.Trim(),
                TipoNegocio = plantilla.TipoNegocio,
                ColorPrimario = plantilla.ColorPrimario,
                ColorSecundario = plantilla.ColorSecundario,
                TerminoAlumno = plantilla.TerminoAlumno,
                ModoCobro = ModoCobro.PorClase,
                FechaCreacion = DateTime.UtcNow
            };

            // Las clases sugeridas nacen con precio 0 para que el dueño los ajuste en el onboarding
            var clases = plantilla.ClasesSugeridas
                .Select(nombre => new Clase(nombre, 0m) { AcademiaId = academia.Id })
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
