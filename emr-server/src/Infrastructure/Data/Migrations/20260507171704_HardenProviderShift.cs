using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class HardenProviderShift : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "provider_shifts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "provider_shifts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "provider_shifts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "provider_shifts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "provider_shifts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by",
                table: "provider_shifts",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "created_at",
                table: "provider_shifts");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "provider_shifts");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "provider_shifts");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "provider_shifts");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "provider_shifts");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "provider_shifts");
        }
    }
}
