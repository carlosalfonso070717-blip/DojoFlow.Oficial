using System.Collections.Generic;
using System.Linq;

namespace DojoFlow.Domain.Entities
{
    public record PlantillaAcademia(
        string TipoNegocio,
        string TerminoAlumno,
        string ColorPrimario,
        string ColorSecundario,
        IReadOnlyList<string> ClasesSugeridas);

    // Valores iniciales según el giro del negocio; todo se puede cambiar después en Ajustes
    public static class PlantillasAcademia
    {
        public const string Otro = "Otro";

        public static readonly IReadOnlyList<PlantillaAcademia> Todas = new List<PlantillaAcademia>
        {
            new("Artes marciales", "Alumno", "#d90429", "#111418", new[] { "Boxeo", "Kickboxing", "MMA", "Jiu-Jitsu" }),
            new("Danza", "Alumno", "#8e44ad", "#1e1630", new[] { "Ballet", "Jazz", "Contemporáneo", "Hip Hop" }),
            new("Música", "Alumno", "#1565c0", "#0d1b2a", new[] { "Piano", "Guitarra", "Canto", "Batería" }),
            new("Deportes", "Atleta", "#2e7d32", "#102a14", new[] { "Fútbol", "Natación", "Gimnasia", "Tenis" }),
            new("Fitness", "Miembro", "#ef6c00", "#1f1408", new[] { "Yoga", "Pilates", "Funcional", "Spinning" }),
            new("Arte", "Alumno", "#00897b", "#0b2422", new[] { "Pintura", "Dibujo", "Escultura", "Fotografía" }),
            new("Idiomas", "Estudiante", "#3949ab", "#12162e", new[] { "Inglés", "Francés", "Alemán", "Japonés" }),
            new(Otro, "Alumno", "#d90429", "#111418", new string[0]),
        };

        public static PlantillaAcademia Para(string? tipoNegocio) =>
            Todas.FirstOrDefault(p => p.TipoNegocio == tipoNegocio) ?? Todas.First(p => p.TipoNegocio == Otro);
    }
}
