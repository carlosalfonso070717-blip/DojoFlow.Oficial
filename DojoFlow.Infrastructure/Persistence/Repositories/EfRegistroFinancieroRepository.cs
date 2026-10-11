using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence.Repositories
{
    public class EfRegistroFinancieroRepository : IRegistroFinancieroRepository
    {
        private readonly DojoFlowDbContext _context;

        public EfRegistroFinancieroRepository(DojoFlowDbContext context)
        {
            _context = context;
        }

        public async Task<List<RegistroFinanciero>> ObtenerTodosAsync()
        {
            return await _context.RegistrosFinancieros.AsNoTracking()
                .OrderByDescending(r => r.MesAnio)
                .ToListAsync();
        }

        public async Task<RegistroFinanciero?> ObtenerPorMesAsync(string mesAnio)
        {
            return await _context.RegistrosFinancieros.FirstOrDefaultAsync(r => r.MesAnio == mesAnio);
        }

        public async Task RegistrarIngresoAsync(decimal monto, bool esVenta, string concepto, int cantidad = 1)
        {
            var ahora = DateTime.Now;
            string mesActual = ahora.ToString("MM-yyyy");
            var registro = await _context.RegistrosFinancieros.FirstOrDefaultAsync(r => r.MesAnio == mesActual);

            if (registro == null)
            {
                registro = new RegistroFinanciero { MesAnio = mesActual };
                _context.RegistrosFinancieros.Add(registro);
            }

            if (esVenta)
            {
                registro.IngresosVentas += monto;
                registro.VentasRealizadas += cantidad;
            }
            else
            {
                registro.IngresosMensualidades += monto;
            }

            _context.Transacciones.Add(new Transaccion
            {
                Id = Guid.NewGuid(),
                Fecha = ahora,
                MesAnio = mesActual,
                Tipo = esVenta ? TipoTransaccion.Venta : TipoTransaccion.Cuota,
                Concepto = concepto,
                Cantidad = cantidad,
                Monto = monto
            });

            // Total y detalle en una sola transacción
            await _context.SaveChangesAsync();
        }

        public async Task<List<Transaccion>> ObtenerTransaccionesAsync(string mesAnio)
        {
            return await _context.Transacciones.AsNoTracking()
                .Where(t => t.MesAnio == mesAnio)
                .OrderBy(t => t.Fecha)
                .ToListAsync();
        }

        public async Task EliminarAsync(RegistroFinanciero registro)
        {
            // Al borrar el mes también se borra su detalle
            var movimientos = await _context.Transacciones.Where(t => t.MesAnio == registro.MesAnio).ToListAsync();
            _context.Transacciones.RemoveRange(movimientos);
            _context.RegistrosFinancieros.Remove(registro);
            await _context.SaveChangesAsync();
        }
    }
}
