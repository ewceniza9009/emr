using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTelemetryAndSignalRSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "enable_signal_r",
                table: "tenant_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "enable_telemetry",
                table: "tenant_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "telemetry_delay_seconds",
                table: "tenant_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "gender_identity",
                table: "patient_outreaches",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "enable_signal_r",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "enable_telemetry",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "telemetry_delay_seconds",
                table: "tenant_configurations");

            migrationBuilder.AlterColumn<string>(
                name: "gender_identity",
                table: "patient_outreaches",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);
        }
    }
}
