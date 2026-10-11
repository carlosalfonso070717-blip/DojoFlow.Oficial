using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DojoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MultiAcademia : Migration
    {
        /// <inheritdoc />
        // Todos los datos existentes (previos al modo multi-academia) pertenecen a Dominio Combat Club
        private static readonly Guid IdDominio = new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11");

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTA: las columnas AcademiaId y Rol se crean con valor por defecto solo para
            // rellenar las filas existentes (alumnos, recibos y coaches de Dominio); al final
            // de la migración se quitan esos defaults para que la app siempre asigne la academia.

            migrationBuilder.DropIndex(
                name: "IX_RegistrosFinancieros_MesAnio",
                table: "RegistrosFinancieros");

            migrationBuilder.AddColumn<Guid>(
                name: "AcademiaId",
                table: "UsuariosCoach",
                type: "uuid",
                nullable: false,
                defaultValue: IdDominio);

            migrationBuilder.AddColumn<string>(
                name: "Rol",
                table: "UsuariosCoach",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Dueno");

            migrationBuilder.AddColumn<bool>(
                name: "TourCompletado",
                table: "UsuariosCoach",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "AcademiaId",
                table: "RegistrosFinancieros",
                type: "uuid",
                nullable: false,
                defaultValue: IdDominio);

            migrationBuilder.AddColumn<Guid>(
                name: "AcademiaId",
                table: "Productos",
                type: "uuid",
                nullable: false,
                defaultValue: IdDominio);

            migrationBuilder.AddColumn<Guid>(
                name: "AcademiaId",
                table: "Mensualidades",
                type: "uuid",
                nullable: false,
                defaultValue: IdDominio);

            migrationBuilder.AddColumn<Guid>(
                name: "AcademiaId",
                table: "Alumnos",
                type: "uuid",
                nullable: false,
                defaultValue: IdDominio);

            migrationBuilder.CreateTable(
                name: "Academias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    TipoNegocio = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    ColorPrimario = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    ColorSecundario = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false),
                    Logo = table.Column<byte[]>(type: "bytea", nullable: true),
                    LogoContentType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    LogoVersion = table.Column<int>(type: "integer", nullable: false),
                    TerminoAlumno = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    ModoCobro = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PreciosPaquete = table.Column<List<decimal>>(type: "numeric[]", nullable: false),
                    Moneda = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    DiaVencimiento = table.Column<int>(type: "integer", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Academias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Clases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademiaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Precio = table.Column<decimal>(type: "numeric", nullable: false),
                    Activa = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Clases_Academias_AcademiaId",
                        column: x => x.AcademiaId,
                        principalTable: "Academias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Academias",
                columns: new[] { "Id", "ColorPrimario", "ColorSecundario", "DiaVencimiento", "FechaCreacion", "Logo", "LogoContentType", "LogoVersion", "ModoCobro", "Moneda", "Nombre", "PreciosPaquete", "TerminoAlumno", "TipoNegocio" },
                values: new object[] { new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"), "#d90429", "#111418", 15, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, 0, "Paquete", "MXN", "Dominio Combat Club", new List<decimal> { 850m, 1500m, 2400m, 3200m, 4000m }, "Peleador", "Artes marciales" });

            migrationBuilder.UpdateData(
                table: "Alumnos",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"),
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "Alumnos",
                keyColumn: "Id",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e"),
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "Mensualidades",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f"),
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("a7b8c9d0-e1f2-3a4b-5c6d-7e8f90011223"),
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("b8c9d0e1-f2a3-4b5c-6d7e-8f9001122334"),
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("c9d0e1f2-a3b4-5c6d-7e8f-900112233445"),
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90"),
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9001"),
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f900112"),
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "RegistrosFinancieros",
                keyColumn: "Id",
                keyValue: 1,
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.UpdateData(
                table: "RegistrosFinancieros",
                keyColumn: "Id",
                keyValue: 2,
                column: "AcademiaId",
                value: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"));

            migrationBuilder.InsertData(
                table: "Clases",
                columns: new[] { "Id", "AcademiaId", "Activa", "Nombre", "Precio" },
                values: new object[,]
                {
                    { new Guid("0a6f1c3e-1b2d-4e5f-8a9b-000000000001"), new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"), true, "MMA", 850m },
                    { new Guid("0a6f1c3e-1b2d-4e5f-8a9b-000000000002"), new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"), true, "Boxeo", 850m },
                    { new Guid("0a6f1c3e-1b2d-4e5f-8a9b-000000000003"), new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"), true, "JiuJitsu", 850m },
                    { new Guid("0a6f1c3e-1b2d-4e5f-8a9b-000000000004"), new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"), true, "Kickboxing", 850m },
                    { new Guid("0a6f1c3e-1b2d-4e5f-8a9b-000000000005"), new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"), true, "Judo", 850m }
                });

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosCoach_AcademiaId",
                table: "UsuariosCoach",
                column: "AcademiaId");

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosFinancieros_AcademiaId_MesAnio",
                table: "RegistrosFinancieros",
                columns: new[] { "AcademiaId", "MesAnio" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Productos_AcademiaId",
                table: "Productos",
                column: "AcademiaId");

            migrationBuilder.CreateIndex(
                name: "IX_Mensualidades_AcademiaId",
                table: "Mensualidades",
                column: "AcademiaId");

            migrationBuilder.CreateIndex(
                name: "IX_Alumnos_AcademiaId_ClaveKiosco",
                table: "Alumnos",
                columns: new[] { "AcademiaId", "ClaveKiosco" });

            migrationBuilder.CreateIndex(
                name: "IX_Clases_AcademiaId_Nombre",
                table: "Clases",
                columns: new[] { "AcademiaId", "Nombre" });

            migrationBuilder.AddForeignKey(
                name: "FK_Alumnos_Academias_AcademiaId",
                table: "Alumnos",
                column: "AcademiaId",
                principalTable: "Academias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Mensualidades_Academias_AcademiaId",
                table: "Mensualidades",
                column: "AcademiaId",
                principalTable: "Academias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Productos_Academias_AcademiaId",
                table: "Productos",
                column: "AcademiaId",
                principalTable: "Academias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RegistrosFinancieros_Academias_AcademiaId",
                table: "RegistrosFinancieros",
                column: "AcademiaId",
                principalTable: "Academias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UsuariosCoach_Academias_AcademiaId",
                table: "UsuariosCoach",
                column: "AcademiaId",
                principalTable: "Academias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            foreach (var tabla in new[] { "UsuariosCoach", "RegistrosFinancieros", "Productos", "Mensualidades", "Alumnos" })
            {
                migrationBuilder.Sql($"ALTER TABLE \"{tabla}\" ALTER COLUMN \"AcademiaId\" DROP DEFAULT;");
            }
            migrationBuilder.Sql("ALTER TABLE \"UsuariosCoach\" ALTER COLUMN \"Rol\" DROP DEFAULT;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Alumnos_Academias_AcademiaId",
                table: "Alumnos");

            migrationBuilder.DropForeignKey(
                name: "FK_Mensualidades_Academias_AcademiaId",
                table: "Mensualidades");

            migrationBuilder.DropForeignKey(
                name: "FK_Productos_Academias_AcademiaId",
                table: "Productos");

            migrationBuilder.DropForeignKey(
                name: "FK_RegistrosFinancieros_Academias_AcademiaId",
                table: "RegistrosFinancieros");

            migrationBuilder.DropForeignKey(
                name: "FK_UsuariosCoach_Academias_AcademiaId",
                table: "UsuariosCoach");

            migrationBuilder.DropTable(
                name: "Clases");

            migrationBuilder.DropTable(
                name: "Academias");

            migrationBuilder.DropIndex(
                name: "IX_UsuariosCoach_AcademiaId",
                table: "UsuariosCoach");

            migrationBuilder.DropIndex(
                name: "IX_RegistrosFinancieros_AcademiaId_MesAnio",
                table: "RegistrosFinancieros");

            migrationBuilder.DropIndex(
                name: "IX_Productos_AcademiaId",
                table: "Productos");

            migrationBuilder.DropIndex(
                name: "IX_Mensualidades_AcademiaId",
                table: "Mensualidades");

            migrationBuilder.DropIndex(
                name: "IX_Alumnos_AcademiaId_ClaveKiosco",
                table: "Alumnos");

            migrationBuilder.DropColumn(
                name: "AcademiaId",
                table: "UsuariosCoach");

            migrationBuilder.DropColumn(
                name: "Rol",
                table: "UsuariosCoach");

            migrationBuilder.DropColumn(
                name: "TourCompletado",
                table: "UsuariosCoach");

            migrationBuilder.DropColumn(
                name: "AcademiaId",
                table: "RegistrosFinancieros");

            migrationBuilder.DropColumn(
                name: "AcademiaId",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "AcademiaId",
                table: "Mensualidades");

            migrationBuilder.DropColumn(
                name: "AcademiaId",
                table: "Alumnos");

            migrationBuilder.UpdateData(
                table: "Alumnos",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"),
                column: "Disciplinas",
                value: new List<string> { "MMA", "JiuJitsu" });

            migrationBuilder.UpdateData(
                table: "Alumnos",
                keyColumn: "Id",
                keyValue: new Guid("b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e"),
                column: "Disciplinas",
                value: new List<string> { "Boxeo" });

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosFinancieros_MesAnio",
                table: "RegistrosFinancieros",
                column: "MesAnio",
                unique: true);
        }
    }
}
