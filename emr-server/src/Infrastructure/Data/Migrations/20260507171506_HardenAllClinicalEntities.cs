using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class HardenAllClinicalEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "z_benefit_claims",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "vital_signs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "telemetry_logs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "spiritual_assessments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "smart_phrases",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "sdoh_assessments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "questions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "questionnaires",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "prescriptions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "patient_phones",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "patient_phones",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "patient_phones",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "patient_phones",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "patient_phones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by",
                table: "patient_phones",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "patient_outreaches",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "patient_emails",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "patient_emails",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "patient_emails",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "patient_emails",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "patient_emails",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by",
                table: "patient_emails",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "patient_documents",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "patient_contacts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "outreach_scripts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "outreach_scripts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "outreach_scripts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "outreach_scripts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "outreach_scripts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by",
                table: "outreach_scripts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "outreach_contacts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "outreach_activities",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "navigation_tasks",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "intervention_logs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "integration_profiles",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<string>(
                name: "created_by",
                table: "integration_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "integration_profiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "integration_profiles",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "integration_profiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "updated_by",
                table: "integration_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "esas_assessments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "equipment_deliveries",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "entity_addresses",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "durable_medical_equipment",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "diagnoses",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "clinical_notes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "claim_status_logs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "barrier_logs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "assessment_responses",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "tenant_id",
                table: "allergies",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "z_benefit_claims");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "vital_signs");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "telemetry_logs");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "spiritual_assessments");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "smart_phrases");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "sdoh_assessments");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "questions");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "questionnaires");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "prescriptions");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "patient_phones");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "patient_phones");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "patient_phones");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "patient_phones");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "patient_phones");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "patient_phones");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "patient_outreaches");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "patient_emails");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "patient_emails");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "patient_emails");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "patient_emails");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "patient_emails");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "patient_emails");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "patient_documents");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "patient_contacts");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "outreach_scripts");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "outreach_scripts");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "outreach_scripts");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "outreach_scripts");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "outreach_scripts");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "outreach_scripts");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "outreach_contacts");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "outreach_activities");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "navigation_tasks");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "intervention_logs");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "integration_profiles");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "integration_profiles");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "integration_profiles");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "integration_profiles");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "integration_profiles");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "integration_profiles");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "esas_assessments");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "equipment_deliveries");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "entity_addresses");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "durable_medical_equipment");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "diagnoses");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "clinical_notes");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "claim_status_logs");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "barrier_logs");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "assessment_responses");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "allergies");
        }
    }
}
