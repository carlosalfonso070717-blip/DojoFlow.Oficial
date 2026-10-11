using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DojoFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CatalogoYPrecios : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Los productos que ya existen entran al catálogo (EnCatalogo = true)
            migrationBuilder.AddColumn<bool>(
                name: "EnCatalogo",
                table: "Productos",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Precio",
                table: "Productos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "CodigoCatalogo",
                table: "Academias",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Academias",
                keyColumn: "Id",
                keyValue: new Guid("5d1f0c2a-7b3e-4c8a-9f61-2a4e8b0c9d11"),
                column: "CodigoCatalogo",
                value: null);

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("a7b8c9d0-e1f2-3a4b-5c6d-7e8f90011223"),
                columns: new[] { "EnCatalogo", "Precio" },
                values: new object[] { true, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("b8c9d0e1-f2a3-4b5c-6d7e-8f9001122334"),
                columns: new[] { "EnCatalogo", "Precio" },
                values: new object[] { true, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("c9d0e1f2-a3b4-5c6d-7e8f-900112233445"),
                columns: new[] { "EnCatalogo", "Precio" },
                values: new object[] { true, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f90"),
                columns: new[] { "EnCatalogo", "Precio" },
                values: new object[] { true, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9001"),
                columns: new[] { "EnCatalogo", "Precio" },
                values: new object[] { true, 0m });

            migrationBuilder.UpdateData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: new Guid("f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f900112"),
                columns: new[] { "EnCatalogo", "Precio" },
                values: new object[] { true, 0m });

            migrationBuilder.CreateIndex(
                name: "IX_Academias_CodigoCatalogo",
                table: "Academias",
                column: "CodigoCatalogo",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Academias_CodigoCatalogo",
                table: "Academias");

            migrationBuilder.DropColumn(
                name: "EnCatalogo",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "Precio",
                table: "Productos");

            migrationBuilder.DropColumn(
                name: "CodigoCatalogo",
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
