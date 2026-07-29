using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IRegistroFinancieroRepository
    {
        Task<List<RegistroFinanciero>> ObtenerTodosAsync();
        Task<RegistroFinanciero?> ObtenerPorMesAsync(string mesAnio);
        Task RegistrarIngresoAsync(decimal monto, bool esVenta);
        Task EliminarAsync(RegistroFinanciero registro);
    }
}
