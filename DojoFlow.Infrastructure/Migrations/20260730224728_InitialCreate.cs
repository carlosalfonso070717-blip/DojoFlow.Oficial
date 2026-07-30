using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DojoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Alumnos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Apellido = table.Column<string>(type: "text", nullable: false),
                    Telefono = table.Column<string>(type: "text", nullable: false),
                    FechaInscripcion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    ClaveKiosco = table.Column<int>(type: "integer", nullable: false),
                    Disciplinas = table.Column<List<string>>(type: "text[]", nullable: false),
                    CostoMensualidad = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alumnos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Mensualidades",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AlumnoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Monto = table.Column<decimal>(type: "numeric", nullable: false),
                    FechaGeneracion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    FechaPago = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    EstadoActual = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mensualidades", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Productos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    StockActual = table.Column<int>(type: "integer", nullable: false),
                    StockMinimo = table.Column<int>(type: "integer", nullable: false),
                    ImagenUrl = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Productos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RegistrosFinancieros",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MesAnio = table.Column<string>(type: "text", nullable: false),
                    IngresosMensualidades = table.Column<decimal>(type: "numeric", nullable: false),
                    IngresosVentas = table.Column<decimal>(type: "numeric", nullable: false),
                    VentasRealizadas = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegistrosFinancieros", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UsuariosCoach",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    ResetPinHash = table.Column<string>(type: "text", nullable: true),
                    ResetPinExpiracion = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuariosCoach", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Alumnos",
                columns: new[] { "Id", "Activo", "Apellido", "ClaveKiosco", "CostoMensualidad", "Disciplinas", "FechaInscripcion", "Nombre", "Telefono" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"), true, "Llanes", 12345, 1500.00m, new List<string> { "MMA", "JiuJitsu" }, new DateTime(2026, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "Carlos", "9991234567" },
                    { new Guid("b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e"), true, "Sosa", 98765, 850.00m, new List<string> { "Boxeo" }, new DateTime(2026, 1, 15, 0, 0, 0, 0, DateTimeKind.Utc), "María", "9999876543" }
                });

            migrationBuilder.InsertData(
                table: "Mensualidades",
                columns: new[] { "Id", "AlumnoId", "EstadoActual", "FechaGeneracion", "FechaPago", "FechaVencimiento", "Monto" },
                values: new object[] { new Guid("c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f"), new Guid("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"), "Pendiente", new DateTime(2026, 5, 15, 0, 0, 0, 0, DateTimeKind.Utc), null, new DateTime(2026, 6, 15, 0, 0, 0, 0, DateTimeKind.Utc), 1500.00m });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "ImagenUrl", "Nombre", "StockActual", "StockMinimo" },
                values: new object[,]
                {
                    { new Guid("a7b8c9d0-e1f2-3a4b-5c6d-7e8f90011223"), "", "Espinilleras Fighter Legend", 10, 2 },
                    { new Guid("b8c9d0e1-f2a3-4b5c-6d7e-8f9001122334"), "", "Bucales de GuardPro", 10, 4 },
                    { new Guid("c9d0e1f2-a3b4-5c6d-7e8f-900112233445"), "", "Aguas", 10, 5 },
                    { new Guid("d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90"), "", "Cinturón (Todos los colores)", 10, 3 },
                    { new Guid("e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9001"), "", "Guantes de 16 oz", 10, 3 },
                    { new Guid("f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f900112"), "", "Guantes de 14 oz", 10, 3 }
                });

            migrationBuilder.InsertData(
                table: "RegistrosFinancieros",
                columns: new[] { "Id", "IngresosMensualidades", "IngresosVentas", "MesAnio", "VentasRealizadas" },
                values: new object[,]
                {
                    { 1, 15000m, 4500m, "04-2026", 20 },
                    { 2, 18500m, 3200m, "05-2026", 15 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosFinancieros_MesAnio",
                table: "RegistrosFinancieros",
                column: "MesAnio",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alumnos");

            migrationBuilder.DropTable(
                name: "Mensualidades");

            migrationBuilder.DropTable(
                name: "Productos");

            migrationBuilder.DropTable(
                name: "RegistrosFinancieros");

            migrationBuilder.DropTable(
                name: "UsuariosCoach");
        }
    }
}
