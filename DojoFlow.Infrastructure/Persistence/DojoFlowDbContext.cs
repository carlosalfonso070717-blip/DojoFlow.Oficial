using DojoFlow.Application.Interfaces;
using DojoFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace DojoFlow.Infrastructure.Persistence
{
    public class DojoFlowDbContext : DbContext
    {
        // Academia original del sistema: todos los datos previos al modo multi-academia son suyos
        public static readonly Guid IdDominioCombatClub = Guid.Parse("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11");

        private readonly ITenantContext _tenant;

        public DojoFlowDbContext(DbContextOptions<DojoFlowDbContext> options, ITenantContext tenant) : base(options)
        {
            _tenant = tenant;
        }

        // Lo leen los filtros globales en cada consulta (EF lo re-evalúa por instancia del contexto)
        private Guid AcademiaActualId => _tenant.AcademiaId;

        public DbSet<Academia> Academias => Set<Academia>();
        public DbSet<Clase> Clases => Set<Clase>();
        public DbSet<Alumno> Alumnos => Set<Alumno>();
        public DbSet<Mensualidad> Mensualidades => Set<Mensualidad>();
        public DbSet<Producto> Productos => Set<Producto>();
        public DbSet<RegistroFinanciero> RegistrosFinancieros => Set<RegistroFinanciero>();
        public DbSet<UsuarioCoach> UsuariosCoach => Set<UsuarioCoach>();
        public DbSet<VerificacionEmail> VerificacionesEmail => Set<VerificacionEmail>();
        public DbSet<Transaccion> Transacciones => Set<Transaccion>();
        public DbSet<Imagen> Imagenes => Set<Imagen>();
        public DbSet<Asistencia> Asistencias => Set<Asistencia>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Academia>(academia =>
            {
                academia.Property(a => a.Nombre).HasMaxLength(120);
                academia.Property(a => a.TipoNegocio).HasMaxLength(60);
                academia.Property(a => a.ColorPrimario).HasMaxLength(7);
                academia.Property(a => a.ColorSecundario).HasMaxLength(7);
                academia.Property(a => a.TerminoAlumno).HasMaxLength(40);
                academia.Property(a => a.Moneda).HasMaxLength(3);
                academia.Property(a => a.LogoContentType).HasMaxLength(40);
                academia.Property(a => a.ModoCobro).HasConversion<string>().HasMaxLength(20);
                academia.Property(a => a.CodigoCatalogo).HasMaxLength(16);
                academia.HasIndex(a => a.CodigoCatalogo).IsUnique();
            });

            modelBuilder.Entity<Clase>(clase =>
            {
                clase.Property(c => c.Nombre).HasMaxLength(80);
                clase.HasIndex(c => new { c.AcademiaId, c.Nombre });
            });

            modelBuilder.Entity<UsuarioCoach>(usuario =>
            {
                usuario.Property(u => u.Rol).HasMaxLength(20);
                usuario.HasOne<Academia>().WithMany().HasForeignKey(u => u.AcademiaId);
            });

            modelBuilder.Entity<RegistroFinanciero>()
                .HasIndex(r => new { r.AcademiaId, r.MesAnio })
                .IsUnique();

            modelBuilder.Entity<Alumno>()
                .HasIndex(a => new { a.AcademiaId, a.ClaveKiosco });

            modelBuilder.Entity<Transaccion>(t =>
            {
                t.Property(x => x.MesAnio).HasMaxLength(7);
                t.Property(x => x.Concepto).HasMaxLength(160);
                t.Property(x => x.Tipo).HasConversion<string>().HasMaxLength(10);
                t.HasIndex(x => new { x.AcademiaId, x.MesAnio });
            });

            modelBuilder.Entity<VerificacionEmail>()
                .HasIndex(v => v.Email)
                .IsUnique();

            // Comparador explícito para que EF detecte correctamente los cambios en la lista
            // (sin esto, compara por referencia y cree que "cambia" en cada build)
            modelBuilder.Entity<Alumno>()
                .Property(a => a.Disciplinas)
                .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                    (listaA, listaB) => listaA!.SequenceEqual(listaB!),
                    lista => lista.Aggregate(0, (hash, valor) => HashCode.Combine(hash, valor.GetHashCode())),
                    lista => lista.ToList()));

            modelBuilder.Entity<Academia>()
                .Property(a => a.PreciosPaquete)
                .Metadata.SetValueComparer(new ValueComparer<List<decimal>>(
                    (listaA, listaB) => listaA!.SequenceEqual(listaB!),
                    lista => lista.Aggregate(0, (hash, valor) => HashCode.Combine(hash, valor.GetHashCode())),
                    lista => lista.ToList()));

            ConfigurarMultiAcademia<Clase>(modelBuilder);
            ConfigurarMultiAcademia<Alumno>(modelBuilder);
            ConfigurarMultiAcademia<Mensualidad>(modelBuilder);
            ConfigurarMultiAcademia<Producto>(modelBuilder);
            ConfigurarMultiAcademia<RegistroFinanciero>(modelBuilder);
            ConfigurarMultiAcademia<Transaccion>(modelBuilder);
            ConfigurarMultiAcademia<Imagen>(modelBuilder);
            ConfigurarMultiAcademia<Asistencia>(modelBuilder);
            modelBuilder.Entity<Asistencia>(a =>
            {
                a.Property(x => x.NombreAlumno).HasMaxLength(200);
                a.Property(x => x.EstatusFinanciero).HasMaxLength(20);
                // El reporte siempre filtra por academia y periodo
                a.HasIndex(x => new { x.AcademiaId, x.FechaHora });
            });
            modelBuilder.Entity<Imagen>().Property(i => i.ContentType).HasMaxLength(40);
            modelBuilder.Entity<UsuarioCoach>().Property(u => u.FotoUrl).HasMaxLength(200);

            SeedData(modelBuilder);
        }

        // Cada entidad de academia: llave foránea + filtro global para que una academia
        // jamás vea datos de otra, aunque un repositorio olvide filtrar
        private void ConfigurarMultiAcademia<T>(ModelBuilder modelBuilder) where T : class, IPerteneceAAcademia
        {
            modelBuilder.Entity<T>().HasOne<Academia>().WithMany().HasForeignKey(e => e.AcademiaId);
            modelBuilder.Entity<T>().HasQueryFilter(e => e.AcademiaId == AcademiaActualId);
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            AsignarAcademia();
            return base.SaveChangesAsync(cancellationToken);
        }

        public override int SaveChanges()
        {
            AsignarAcademia();
            return base.SaveChanges();
        }

        // Los registros nuevos heredan la academia del usuario autenticado
        private void AsignarAcademia()
        {
            foreach (var entrada in ChangeTracker.Entries<IPerteneceAAcademia>())
            {
                if (entrada.State != EntityState.Added || entrada.Entity.AcademiaId != Guid.Empty) continue;

                if (AcademiaActualId == Guid.Empty)
                    throw new InvalidOperationException(
                        $"No se puede guardar {entrada.Entity.GetType().Name} sin una academia asignada.");

                entrada.Entity.AcademiaId = AcademiaActualId;
            }
        }

        private static void SeedData(ModelBuilder modelBuilder)
        {
            var idDominio = IdDominioCombatClub;

            modelBuilder.Entity<Academia>().HasData(new Academia
            {
                Id = idDominio,
                Nombre = "Dominio Combat Club",
                TipoNegocio = "Artes marciales",
                ColorPrimario = "#d90429",
                ColorSecundario = "#111418",
                TerminoAlumno = "Peleador",
                // Los precios que estaban fijos en CalculadoraMensualidad
                ModoCobro = ModoCobro.Paquete,
                PreciosPaquete = new List<decimal> { 850m, 1500m, 2400m, 3200m, 4000m },
                Moneda = "MXN",
                DiaVencimiento = 15,
                // La academia original ya usaba el registrador de asistencias
                AsistenciasActivas = true,
                FechaCreacion = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            });

            // Las disciplinas que antes estaban fijas en el frontend
            modelBuilder.Entity<Clase>().HasData(
                new Clase { Id = Guid.Parse("0a6f1c3e-1b2d-4e5f-8a9b-000000000001"), AcademiaId = idDominio, Nombre = "MMA", Precio = 850m, Activa = true },
                new Clase { Id = Guid.Parse("0a6f1c3e-1b2d-4e5f-8a9b-000000000002"), AcademiaId = idDominio, Nombre = "Boxeo", Precio = 850m, Activa = true },
                new Clase { Id = Guid.Parse("0a6f1c3e-1b2d-4e5f-8a9b-000000000003"), AcademiaId = idDominio, Nombre = "JiuJitsu", Precio = 850m, Activa = true },
                new Clase { Id = Guid.Parse("0a6f1c3e-1b2d-4e5f-8a9b-000000000004"), AcademiaId = idDominio, Nombre = "Kickboxing", Precio = 850m, Activa = true },
                new Clase { Id = Guid.Parse("0a6f1c3e-1b2d-4e5f-8a9b-000000000005"), AcademiaId = idDominio, Nombre = "Judo", Precio = 850m, Activa = true }
            );

            var idCarlos = Guid.Parse("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d");
            var idMaria = Guid.Parse("b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e");
            var fechaInscripcion = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<Alumno>().HasData(
                new Alumno
                {
                    Id = idCarlos,
                    AcademiaId = idDominio,
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
                    AcademiaId = idDominio,
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
                    AcademiaId = idDominio,
                    AlumnoId = idCarlos,
                    Monto = 1500.00m,
                    FechaGeneracion = new DateTime(2026, 5, 15, 0, 0, 0, DateTimeKind.Utc),
                    FechaVencimiento = new DateTime(2026, 6, 15, 0, 0, 0, DateTimeKind.Utc),
                    FechaPago = null,
                    EstadoActual = "Pendiente"
                }
            );

            modelBuilder.Entity<RegistroFinanciero>().HasData(
                new RegistroFinanciero { Id = 1, AcademiaId = idDominio, MesAnio = "04-2026", IngresosMensualidades = 15000, IngresosVentas = 4500, VentasRealizadas = 20 },
                new RegistroFinanciero { Id = 2, AcademiaId = idDominio, MesAnio = "05-2026", IngresosMensualidades = 18500, IngresosVentas = 3200, VentasRealizadas = 15 }
            );

            modelBuilder.Entity<Producto>().HasData(
                new Producto(Guid.Parse("d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90"), "Cinturón (Todos los colores)", 10, 3) { AcademiaId = idDominio },
                new Producto(Guid.Parse("e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9001"), "Guantes de 16 oz", 10, 3) { AcademiaId = idDominio },
                new Producto(Guid.Parse("f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f900112"), "Guantes de 14 oz", 10, 3) { AcademiaId = idDominio },
                new Producto(Guid.Parse("a7b8c9d0-e1f2-3a4b-5c6d-7e8f90011223"), "Espinilleras Fighter Legend", 10, 2) { AcademiaId = idDominio },
                new Producto(Guid.Parse("b8c9d0e1-f2a3-4b5c-6d7e-8f9001122334"), "Bucales de GuardPro", 10, 4) { AcademiaId = idDominio },
                new Producto(Guid.Parse("c9d0e1f2-a3b4-5c6d-7e8f-900112233445"), "Aguas", 10, 5) { AcademiaId = idDominio }
            );
        }
    }
}
