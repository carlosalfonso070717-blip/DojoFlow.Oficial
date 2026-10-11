namespace DojoFlow.Application.Interfaces
{
    // Puerto que indica en qué academia se está trabajando en la petición actual.
    // El adaptador de la API lo resuelve a partir del token JWT.
    public interface ITenantContext
    {
        // Guid.Empty cuando no hay academia (peticiones anónimas)
        Guid AcademiaId { get; }
    }
}
