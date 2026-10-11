using System;

namespace DojoFlow.Domain.Entities
{
    // Un registro del registrador de asistencias: quién marcó su PIN, cuándo y si pudo pasar.
    // Guarda el nombre tal como estaba ese día para que el historial sobreviva a una baja.
    public class Asistencia : IPerteneceAAcademia
    {
        public Guid Id { get; set; }
        public Guid AcademiaId { get; set; }
        public Guid AlumnoId { get; set; }
        public string NombreAlumno { get; set; } = string.Empty;
        public DateTime FechaHora { get; set; }
        public bool PermitirAcceso { get; set; }
        // Estatus de pago al momento de entrar: "Pagado", "Pendiente", "Vencido"
        public string EstatusFinanciero { get; set; } = string.Empty;
    }
}
