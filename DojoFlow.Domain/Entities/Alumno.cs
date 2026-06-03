namespace DojoFlow.Domain.Entities
{
    public class Alumno
    {
        public Guid Id { get; private set; }
        public string Nombre { get; private set; }
        public string Apellido { get; private set; }
        public string Telefono { get; private set; }
        public DateTime FechaInscripcion { get; private set; }
        public bool Activo { get; private set; }

        // Constructor para encapsular la creación segura de un alumno
        public Alumno(string nombre, string apellido, string telefono)
        {
            Id = Guid.NewGuid();
            Nombre = nombre;
            Apellido = apellido;
            Telefono = telefono;
            FechaInscripcion = DateTime.UtcNow;
            Activo = true; // Por defecto inicia activo
        }

        // Regla de negocio: Un alumno puede ser suspendido si no paga
        public void Desactivar()
        {
            Activo = false;
        }

        public void Activar()
        {
            Activo = true;
        }
    }
}