using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientComplianceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "consent_hipaa",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "consent_marketing",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "consent_to_treat",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "has_advance_directive",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "has_poa",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "interpreter_required",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "preferred_contact_method",
                table: "patients",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "consent_hipaa",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "consent_marketing",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "consent_to_treat",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "has_advance_directive",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "has_poa",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "interpreter_required",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "preferred_contact_method",
                table: "patients");
        }
    }
}
