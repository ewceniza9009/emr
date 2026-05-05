using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HardenPatientProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "civil_status",
                table: "patients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "language",
                table: "patients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "nationality",
                table: "patients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "occupation",
                table: "patients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "place_of_birth",
                table: "patients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "religion",
                table: "patients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "patient_contact_id",
                table: "patient_documents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_legal_guardian",
                table: "patient_contacts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "patient_contacts",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_patient_documents_patient_contact_id",
                table: "patient_documents",
                column: "patient_contact_id");

            migrationBuilder.AddForeignKey(
                name: "fk_patient_documents_patient_contacts_patient_contact_id",
                table: "patient_documents",
                column: "patient_contact_id",
                principalTable: "patient_contacts",
                principalColumn: "contact_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_patient_documents_patient_contacts_patient_contact_id",
                table: "patient_documents");

            migrationBuilder.DropIndex(
                name: "ix_patient_documents_patient_contact_id",
                table: "patient_documents");

            migrationBuilder.DropColumn(
                name: "civil_status",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "language",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "nationality",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "occupation",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "place_of_birth",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "religion",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "patient_contact_id",
                table: "patient_documents");

            migrationBuilder.DropColumn(
                name: "is_legal_guardian",
                table: "patient_contacts");

            migrationBuilder.DropColumn(
                name: "notes",
                table: "patient_contacts");
        }
    }
}
