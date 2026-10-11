using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Services;

namespace DojoFlow.Application.UseCases.Mensualidades
{
    // Aplica el ciclo mensual (vencer y generar el recibo siguiente) a los alumnos de la academia actual.
    // Se ejecuta al consultar cobros y al checar en el kiosco, así los estados siempre están al día
    // sin depender de una tarea programada.
    public class ActualizarMensualidadesUseCase
    {
        private readonly IAlumnoRepository _alumnoRepository;
        private readonly IMensualidadRepository _mensualidadRepository;

        public ActualizarMensualidadesUseCase(IAlumnoRepository alumnoRepository, IMensualidadRepository mensualidadRepository)
        {
            _alumnoRepository = alumnoRepository;
            _mensualidadRepository = mensualidadRepository;
        }

        public async Task EjecutarAsync(DateTime hoy)
        {
            var alumnos = await _alumnoRepository.ObtenerTodosAsync();
            var recibos = await _mensualidadRepository.ObtenerTodasAsync();

            foreach (var alumno in alumnos)
            {
                var resultado = CicloMensualidades.Aplicar(alumno, recibos.Where(r => r.AlumnoId == alumno.Id), hoy);
                await GuardarAsync(resultado);
            }
        }

        public async Task EjecutarParaAlumnoAsync(Guid alumnoId, DateTime hoy)
        {
            var alumno = await _alumnoRepository.ObtenerPorIdAsync(alumnoId);
            if (alumno == null) return;

            var recibos = await _mensualidadRepository.ObtenerPorAlumnoAsync(alumnoId);
            await GuardarAsync(CicloMensualidades.Aplicar(alumno, recibos, hoy));
        }

        private async Task GuardarAsync(ResultadoCiclo resultado)
        {
            if (!resultado.HuboCambios) return;
            foreach (var vencida in resultado.Vencidas) await _mensualidadRepository.ActualizarAsync(vencida);
            if (resultado.Nueva != null) await _mensualidadRepository.AgregarAsync(resultado.Nueva);
        }
    }
}
