using System;
using System.Collections.Generic;

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

        // ID de 5 dígitos generado automáticamente para el kiosco
        public int ClaveKiosco { get; private set; }

        public List<string> Disciplinas { get; private set; } = new();

        private Alumno() { }

        public void Desactivar() => Activo = false;
        public void Activar() => Activo = true;

        public class Builder
        {
            private readonly Alumno _alumno = new Alumno();
            // Usamos Random para generar el PIN
            private static readonly Random _random = new Random();

            public Builder()
            {
                _alumno.Id = Guid.NewGuid();
                _alumno.FechaInscripcion = DateTime.UtcNow;
                _alumno.Activo = true;

                // AUTOGENERAMOS LA CLAVE: Un número entre 10000 y 99999
                _alumno.ClaveKiosco = _random.Next(10000, 100000);
            }

            public Builder ConNombre(string nombre) { _alumno.Nombre = nombre; return this; }
            public Builder ConApellido(string apellido) { _alumno.Apellido = apellido; return this; }
            public Builder ConTelefono(string telefono) { _alumno.Telefono = telefono; return this; }

            public Builder ConDisciplinas(List<string> disciplinas)
            {
                _alumno.Disciplinas = disciplinas ?? new List<string>();
                return this;
            }

            public Alumno Build()
            {
                if (string.IsNullOrWhiteSpace(_alumno.Nombre) || string.IsNullOrWhiteSpace(_alumno.Apellido))
                {
                    throw new ArgumentException("Error: El alumno debe tener un nombre y un apellido válidos.");
                }
                return _alumno;
            }
        }
    }
}