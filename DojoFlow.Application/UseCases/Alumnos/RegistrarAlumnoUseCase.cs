using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;

namespace DojoFlow.Application.UseCases.Alumnos
{
    public class RegistrarAlumnoUseCase
    {
        private readonly IAlumnoRepository _alumnoRepository;

        // Inyección de dependencias a través del Puerto (Interfaz)
        public RegistrarAlumnoUseCase(IAlumnoRepository alumnoRepository)
        {
            _alumnoRepository = alumnoRepository;
        }

        // Ejecución del caso de uso
        public async Task<Guid> EjecutarAsync(string nombre, string apellido, string telefono)
        {
            // 1. Validaciones básicas de negocio si fuesen necesarias
            if (string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(apellido))
            {
                throw new ArgumentException("El nombre y apellido son obligatorios para el registro.");
            }

            // 2. Instanciar la entidad pidiendo las reglas al Dominio
            var nuevoAlumno = new Alumno(nombre, apellido, telefono);

            // 3. Persistir usando el puerto abstractamente
            await _alumnoRepository.GuardarAsync(nuevoAlumno);

            // 4. Retornar el ID del alumno creado
            return nuevoAlumno.Id;
        }
    }
}