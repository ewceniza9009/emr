using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FinalHardenEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "practitioner_service_areas",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "practitioner_service_areas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "practitioner_service_areas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "practitioner_service_areas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "practitioner_service_areas",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by",
                table: "practitioner_service_areas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "practitioner_licensures",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "practitioner_licensures",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "practitioner_licensures",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "practitioner_licensures",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "practitioner_licensures",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by",
                table: "practitioner_licensures",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "health_plans",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "facilities",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "advance_directives",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "advance_directives",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "advance_directives",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "advance_directives",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "advance_directives",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by",
                table: "advance_directives",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "created_at",
                table: "practitioner_service_areas");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "practitioner_service_areas");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "practitioner_service_areas");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "practitioner_service_areas");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "practitioner_service_areas");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "practitioner_service_areas");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "practitioner_licensures");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "practitioner_licensures");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "practitioner_licensures");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "practitioner_licensures");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "practitioner_licensures");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "practitioner_licensures");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "health_plans");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "facilities");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "advance_directives");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "advance_directives");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "advance_directives");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "advance_directives");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "advance_directives");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "advance_directives");
        }
    }
}
