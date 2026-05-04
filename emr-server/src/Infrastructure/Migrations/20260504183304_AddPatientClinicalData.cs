using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientClinicalData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "primary_phone",
                table: "patient_outreaches",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "patient_documents",
                columns: table => new
                {
                    patient_document_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    document_type = table.Column<string>(type: "text", nullable: false),
                    storage_url = table.Column<string>(type: "text", nullable: false),
                    content_type = table.Column<string>(type: "text", nullable: true),
                    file_size = table.Column<long>(type: "bigint", nullable: false),
                    uploaded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    uploaded_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_patient_documents", x => x.patient_document_id);
                    table.ForeignKey(
                        name: "fk_patient_documents__practitioners_uploaded_by_id",
                        column: x => x.uploaded_by_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id");
                    table.ForeignKey(
                        name: "fk_patient_documents_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "spiritual_assessments",
                columns: table => new
                {
                    spiritual_assessment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    encounter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    faith = table.Column<string>(type: "text", nullable: true),
                    importance = table.Column<string>(type: "text", nullable: true),
                    community = table.Column<string>(type: "text", nullable: true),
                    address_in_care = table.Column<string>(type: "text", nullable: true),
                    religious_preference = table.Column<string>(type: "text", nullable: true),
                    clergy_contact = table.Column<string>(type: "text", nullable: true),
                    ClinicalEncounterEncounterId = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_spiritual_assessments", x => x.spiritual_assessment_id);
                    table.ForeignKey(
                        name: "fk_spiritual_assessments_clinical_encounters_clinical_encounte~",
                        column: x => x.ClinicalEncounterEncounterId,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_spiritual_assessments_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_patient_documents_patient_id",
                table: "patient_documents",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_documents_uploaded_by_id",
                table: "patient_documents",
                column: "uploaded_by_id");

            migrationBuilder.CreateIndex(
                name: "IX_spiritual_assessments_ClinicalEncounterEncounterId",
                table: "spiritual_assessments",
                column: "ClinicalEncounterEncounterId");

            migrationBuilder.CreateIndex(
                name: "ix_spiritual_assessments_patient_id",
                table: "spiritual_assessments",
                column: "patient_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "patient_documents");

            migrationBuilder.DropTable(
                name: "spiritual_assessments");

            migrationBuilder.AlterColumn<string>(
                name: "primary_phone",
                table: "patient_outreaches",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);
        }
    }
}
