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
            ValidarDatosObligatorios(nombre, apellido);

            var alumno = ConstruirEntidadAlumno(nombre, apellido, telefono);

            await _alumnoRepository.GuardarAsync(alumno);

            return alumno.Id;
        }

        // EXTRACT METHOD: Aislar las reglas de validación
        private void ValidarDatosObligatorios(string nombre, string apellido)
        {
            if (string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(apellido))
            {
                throw new ArgumentException("El nombre y apellido son obligatorios para el registro.");
            }
            // El día de mañana, cualquier nueva validación va exclusivamente aquí.
        }

        // EXTRACT METHOD: Aislar la complejidad de construcción
        private Alumno ConstruirEntidadAlumno(string nombre, string apellido, string telefono)
        {
            const string DISCIPLINA_POR_DEFECTO = "Por definir";

            return new Alumno.Builder()
                .ConNombre(nombre)
                .ConApellido(apellido)
                .ConTelefono(telefono)
                .ConDisciplinas(new List<string> { DISCIPLINA_POR_DEFECTO })
                .Build();
        }
    }
}