namespace DojoFlow.Domain.Entities
{
    // Marca las entidades que viven dentro de una academia (multi-tenant).
    // La infraestructura usa esta interfaz para filtrar consultas y asignar
    // la academia automáticamente al guardar.
    public interface IPerteneceAAcademia
    {
        Guid AcademiaId { get; set; }
    }
}
