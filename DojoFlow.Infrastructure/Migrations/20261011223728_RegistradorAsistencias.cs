using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DojoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RegistradorAsistencias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AsistenciasActivas",
                table: "Academias",
                type: "boolean",
                nullable: false,
                // Las academias que ya existían usaban el kiosco: lo conservan activo.
                // Las nuevas empiezan sin él (EF siempre manda el valor al crearlas).
                defaultValue: true);

            migrationBuilder.CreateTable(
                name: "Asistencias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademiaId = table.Column<Guid>(type: "uuid", nullable: false),
                    AlumnoId = table.Column<Guid>(type: "uuid", nullable: false),
                    NombreAlumno = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FechaHora = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    PermitirAcceso = table.Column<bool>(type: "boolean", nullable: false),
                    EstatusFinanciero = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Asistencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Asistencias_Academias_AcademiaId",
                        column: x => x.AcademiaId,
                        principalTable: "Academias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Academias",
                keyColumn: "Id",
                keyValue: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"),
                column: "AsistenciasActivas",
                value: true);

            migrationBuilder.CreateIndex(
                name: "IX_Asistencias_AcademiaId_FechaHora",
                table: "Asistencias",
                columns: new[] { "AcademiaId", "FechaHora" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Asistencias");

            migrationBuilder.DropColumn(
                name: "AsistenciasActivas",
                table: "Academias");
        }
    }
}
