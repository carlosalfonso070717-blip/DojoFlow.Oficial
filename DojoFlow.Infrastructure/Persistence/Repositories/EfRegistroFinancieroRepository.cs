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

        public async Task RegistrarIngresoAsync(decimal monto, bool esVenta)
        {
            string mesActual = DateTime.Now.ToString("MM-yyyy");
            var registro = await _context.RegistrosFinancieros.FirstOrDefaultAsync(r => r.MesAnio == mesActual);

            if (registro == null)
            {
                registro = new RegistroFinanciero { MesAnio = mesActual };
                _context.RegistrosFinancieros.Add(registro);
            }

            if (esVenta)
            {
                registro.IngresosVentas += monto;
                registro.VentasRealizadas++;
            }
            else
            {
                registro.IngresosMensualidades += monto;
            }

            await _context.SaveChangesAsync();
        }

        public async Task EliminarAsync(RegistroFinanciero registro)
        {
            _context.RegistrosFinancieros.Remove(registro);
            await _context.SaveChangesAsync();
        }
    }
}
