using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DojoFlow.Infrastructure.Persistence
{
    public class DojoFlowDbContext : DbContext
    {
        public DojoFlowDbContext(DbContextOptions<DojoFlowDbContext> options) : base(options) { }

        public DbSet<Alumno> Alumnos => Set<Alumno>();
        public DbSet<Mensualidad> Mensualidades => Set<Mensualidad>();
        public DbSet<Producto> Productos => Set<Producto>();
        public DbSet<RegistroFinanciero> RegistrosFinancieros => Set<RegistroFinanciero>();
        public DbSet<UsuarioCoach> UsuariosCoach => Set<UsuarioCoach>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RegistroFinanciero>()
                .HasIndex(r => r.MesAnio)
                .IsUnique();

            SeedData(modelBuilder);
        }

        private static void SeedData(ModelBuilder modelBuilder)
        {
            var idCarlos = Guid.Parse("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d");
            var idMaria = Guid.Parse("b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e");
            var fechaInscripcion = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<Alumno>().HasData(
                new Alumno
                {
                    Id = idCarlos,
                    Nombre = "Carlos",
                    Apellido = "Llanes",
                    Telefono = "9991234567",
                    Disciplinas = new List<string> { "MMA", "JiuJitsu" },
                    CostoMensualidad = 1500.00m,
                    ClaveKiosco = 12345,
                    Activo = true,
                    FechaInscripcion = fechaInscripcion
                },
                new Alumno
                {
                    Id = idMaria,
                    Nombre = "María",
                    Apellido = "Sosa",
                    Telefono = "9999876543",
                    Disciplinas = new List<string> { "Boxeo" },
                    CostoMensualidad = 850.00m,
                    ClaveKiosco = 98765,
                    Activo = true,
                    FechaInscripcion = fechaInscripcion
                }
            );

            modelBuilder.Entity<Mensualidad>().HasData(
                new Mensualidad
                {
                    Id = Guid.Parse("c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f"),
                    AlumnoId = idCarlos,
                    Monto = 1500.00m,
                    FechaGeneracion = new DateTime(2026, 5, 15, 0, 0, 0, DateTimeKind.Utc),
                    FechaVencimiento = new DateTime(2026, 6, 15, 0, 0, 0, DateTimeKind.Utc),
                    FechaPago = null,
                    EstadoActual = "Pendiente"
                }
            );

            modelBuilder.Entity<RegistroFinanciero>().HasData(
                new RegistroFinanciero { Id = 1, MesAnio = "04-2026", IngresosMensualidades = 15000, IngresosVentas = 4500, VentasRealizadas = 20 },
                new RegistroFinanciero { Id = 2, MesAnio = "05-2026", IngresosMensualidades = 18500, IngresosVentas = 3200, VentasRealizadas = 15 }
            );

            modelBuilder.Entity<Producto>().HasData(
                new Producto(Guid.Parse("d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90"), "Cinturón (Todos los colores)", 10, 3),
                new Producto(Guid.Parse("e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9001"), "Guantes de 16 oz", 10, 3),
                new Producto(Guid.Parse("f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f900112"), "Guantes de 14 oz", 10, 3),
                new Producto(Guid.Parse("a7b8c9d0-e1f2-3a4b-5c6d-7e8f90011223"), "Espinilleras Fighter Legend", 10, 2),
                new Producto(Guid.Parse("b8c9d0e1-f2a3-4b5c-6d7e-8f9001122334"), "Bucales de GuardPro", 10, 4),
                new Producto(Guid.Parse("c9d0e1f2-a3b4-5c6d-7e8f-900112233445"), "Aguas", 10, 5)
            );
        }
    }
}
