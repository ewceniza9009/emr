using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAmPmBuckets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "am_start_hour",
                table: "tenant_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "day_end_hour",
                table: "tenant_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "engine_safety_dist_km",
                table: "tenant_configurations",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "engine_safety_drive_mins",
                table: "tenant_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "iot_sync_interval_ms",
                table: "tenant_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "pm_start_hour",
                table: "tenant_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "urgent_pain_threshold",
                table: "tenant_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "urgent_wellbeing_threshold",
                table: "tenant_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "am_start_hour",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "day_end_hour",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "engine_safety_dist_km",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "engine_safety_drive_mins",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "iot_sync_interval_ms",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "pm_start_hour",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "urgent_pain_threshold",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "urgent_wellbeing_threshold",
                table: "tenant_configurations");
        }
    }
}
