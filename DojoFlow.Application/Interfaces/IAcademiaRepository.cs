using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IAcademiaRepository
    {
        Task<Academia?> ObtenerPorIdAsync(Guid id);
        Task<Academia?> ObtenerPorCodigoCatalogoAsync(string codigo);
        // Todas las sedes de un negocio: la principal primero y luego por antigüedad
        Task<List<Academia>> ObtenerGrupoAsync(Guid grupoId);
        // Crea la academia (y sus otras sucursales, si las hay), sus clases iniciales y su dueño en una sola transacción
        Task RegistrarAsync(IEnumerable<Academia> academias, IEnumerable<Clase> clases, UsuarioCoach dueno);
        // Agrega una sede nueva a un negocio que ya existe, con sus clases iniciales
        Task AgregarSucursalAsync(Academia sucursal, IEnumerable<Clase> clases);
        Task ActualizarAsync(Academia academia);
        Task ActualizarAsync(IEnumerable<Academia> academias);
        // Borra la sucursal y, en cascada, todo lo suyo: alumnos, cobros, clases, inventario, finanzas, asistencias
        Task EliminarAsync(Academia academia);
    }
}
