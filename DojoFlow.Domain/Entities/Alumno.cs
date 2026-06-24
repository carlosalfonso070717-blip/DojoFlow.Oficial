using System;

namespace DojoFlow.Domain.Entities
{
    public class Alumno
    {
        public Guid Id { get; private set; }
        public string Nombre { get; private set; } = string.Empty;
        public string Apellido { get; private set; } = string.Empty;
        public string Telefono { get; private set; } = string.Empty;
        public DateTime FechaInscripcion { get; private set; }
        public bool Activo { get; private set; }

        // Añadimos esta propiedad para que el patrón Strategy pueda funcionar después
        public string Disciplina { get; private set; } = string.Empty; // Ej: "MMA", "Boxeo", "Muay Thai"

        // Hacemos el constructor privado para que la creación pase obligatoriamente por el Builder
        private Alumno() { }

        public void Desactivar()
        {
            Activo = false;
        }

        public void Activar()
        {
            Activo = true;
        }

        // --- ENCAPSULACIÓN DEL PATRÓN BUILDER (CREACIONAL) ---
        public class Builder
        {
            private readonly Alumno _alumno = new Alumno();

            public Builder()
            {
                _alumno.Id = Guid.NewGuid();
                _alumno.FechaInscripcion = DateTime.UtcNow;
                _alumno.Activo = true;
            }

            public Builder ConNombre(string nombre)
            {
                _alumno.Nombre = nombre;
                return this;
            }

            public Builder ConApellido(string apellido)
            {
                _alumno.Apellido = apellido;
                return this;
            }

            public Builder ConTelefono(string telefono)
            {
                _alumno.Telefono = telefono;
                return this;
            }

            public Builder EnDisciplina(string disciplina)
            {
                _alumno.Disciplina = disciplina;
                return this;
            }

            public Alumno Build()
            {
                // Validación de negocio para asegurar datos mínimos firmes
                if (string.IsNullOrWhiteSpace(_alumno.Nombre) || string.IsNullOrWhiteSpace(_alumno.Apellido))
                {
                    throw new ArgumentException("Error: El alumno debe tener un nombre y un apellido válidos.");
                }
                return _alumno;
            }
        }
    }
}