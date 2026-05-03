using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncSoapNoteColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "patient_mrn_seq",
                startValue: 10000L);

            migrationBuilder.AddColumn<string>(
                name: "assessment",
                table: "clinical_notes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "objective",
                table: "clinical_notes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "plan",
                table: "clinical_notes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "signature_hash",
                table: "clinical_notes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "signed_at",
                table: "clinical_notes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "subjective",
                table: "clinical_notes",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "assessment",
                table: "clinical_notes");

            migrationBuilder.DropColumn(
                name: "objective",
                table: "clinical_notes");

            migrationBuilder.DropColumn(
                name: "plan",
                table: "clinical_notes");

            migrationBuilder.DropColumn(
                name: "signature_hash",
                table: "clinical_notes");

            migrationBuilder.DropColumn(
                name: "signed_at",
                table: "clinical_notes");

            migrationBuilder.DropColumn(
                name: "subjective",
                table: "clinical_notes");

            migrationBuilder.DropSequence(
                name: "patient_mrn_seq");
        }
    }
}
