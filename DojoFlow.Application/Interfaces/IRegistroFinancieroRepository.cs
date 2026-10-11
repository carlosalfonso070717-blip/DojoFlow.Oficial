using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.Interfaces
{
    public interface IRegistroFinancieroRepository
    {
        Task<List<RegistroFinanciero>> ObtenerTodosAsync();
        Task<RegistroFinanciero?> ObtenerPorMesAsync(string mesAnio);
        // Suma al total del mes y guarda el movimiento individual para los reportes
        Task RegistrarIngresoAsync(decimal monto, bool esVenta, string concepto, int cantidad = 1);
        Task<List<Transaccion>> ObtenerTransaccionesAsync(string mesAnio);
        Task EliminarAsync(RegistroFinanciero registro);
    }
}
