using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DojoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ImagenesYFotoPerfil : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FotoUrl",
                table: "UsuariosCoach",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Imagenes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AcademiaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Datos = table.Column<byte[]>(type: "bytea", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Imagenes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Imagenes_Academias_AcademiaId",
                        column: x => x.AcademiaId,
                        principalTable: "Academias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Imagenes_AcademiaId",
                table: "Imagenes",
                column: "AcademiaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Imagenes");

            migrationBuilder.DropColumn(
                name: "FotoUrl",
                table: "UsuariosCoach");

            migrationBuilder.UpdateData(
                table: "Academias",
                keyColumn: "Id",
                keyValue: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"),
                column: "PreciosPaquete",
                value: new List<decimal> { 850m, 1500m, 2400m, 3200m, 4000m });

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
        }
    }
}
