using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DojoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Sucursales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Direccion",
                table: "Academias",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MatrizId",
                table: "Academias",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NombreSucursal",
                table: "Academias",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SucursalesActivas",
                table: "Academias",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "Academias",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Academias",
                keyColumn: "Id",
                keyValue: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"),
                columns: new[] { "Direccion", "MatrizId", "NombreSucursal", "SucursalesActivas", "Telefono" },
                values: new object[] { null, null, null, false, null });

            migrationBuilder.CreateIndex(
                name: "IX_Academias_MatrizId",
                table: "Academias",
                column: "MatrizId");

            migrationBuilder.AddForeignKey(
                name: "FK_Academias_Academias_MatrizId",
                table: "Academias",
                column: "MatrizId",
                principalTable: "Academias",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Academias_Academias_MatrizId",
                table: "Academias");

            migrationBuilder.DropIndex(
                name: "IX_Academias_MatrizId",
                table: "Academias");

            migrationBuilder.DropColumn(
                name: "Direccion",
                table: "Academias");

            migrationBuilder.DropColumn(
                name: "MatrizId",
                table: "Academias");

            migrationBuilder.DropColumn(
                name: "NombreSucursal",
                table: "Academias");

            migrationBuilder.DropColumn(
                name: "SucursalesActivas",
                table: "Academias");

            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "Academias");

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
