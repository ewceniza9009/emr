using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantSecuritySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "enforce_mfa",
                table: "tenant_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "session_timeout_minutes",
                table: "tenant_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "strict_onboarding",
                table: "tenant_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "enforce_mfa",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "session_timeout_minutes",
                table: "tenant_configurations");

            migrationBuilder.DropColumn(
                name: "strict_onboarding",
                table: "tenant_configurations");
        }
    }
}
