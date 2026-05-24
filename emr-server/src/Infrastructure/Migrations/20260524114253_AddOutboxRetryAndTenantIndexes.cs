using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOutboxRetryAndTenantIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "next_attempt_utc",
                table: "outbox_messages",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "retry_count",
                table: "outbox_messages",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_z_benefit_claims_tenant_id",
                table: "z_benefit_claims",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_vital_signs_tenant_id",
                table: "vital_signs",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_tenant_configurations_tenant_id",
                table: "tenant_configurations",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_telemetry_logs_tenant_id",
                table: "telemetry_logs",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_spiritual_assessments_tenant_id",
                table: "spiritual_assessments",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_smart_phrases_tenant_id",
                table: "smart_phrases",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_security_audit_logs_tenant_id",
                table: "security_audit_logs",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_sdoh_assessments_tenant_id",
                table: "sdoh_assessments",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_schedule_blocks_tenant_id",
                table: "schedule_blocks",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_questions_tenant_id",
                table: "questions",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_questionnaires_tenant_id",
                table: "questionnaires",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_provider_shifts_tenant_id",
                table: "provider_shifts",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_prescriptions_tenant_id",
                table: "prescriptions",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_practitioners_tenant_id",
                table: "practitioners",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_practitioner_service_areas_tenant_id",
                table: "practitioner_service_areas",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_practitioner_licensures_tenant_id",
                table: "practitioner_licensures",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_patients_tenant_id",
                table: "patients",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_phones_tenant_id",
                table: "patient_phones",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_outreaches_tenant_id",
                table: "patient_outreaches",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_emails_tenant_id",
                table: "patient_emails",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_documents_tenant_id",
                table: "patient_documents",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_contacts_tenant_id",
                table: "patient_contacts",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_accounts_tenant_id",
                table: "patient_accounts",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_outreach_scripts_tenant_id",
                table: "outreach_scripts",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_outreach_contacts_tenant_id",
                table: "outreach_contacts",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_outreach_activities_tenant_id",
                table: "outreach_activities",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_navigation_tasks_tenant_id",
                table: "navigation_tasks",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_magic_tokens_tenant_id",
                table: "magic_tokens",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_intervention_logs_tenant_id",
                table: "intervention_logs",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_integration_profiles_tenant_id",
                table: "integration_profiles",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_health_plans_tenant_id",
                table: "health_plans",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_facilities_tenant_id",
                table: "facilities",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_esas_assessments_tenant_id",
                table: "esas_assessments",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_deliveries_tenant_id",
                table: "equipment_deliveries",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_entity_addresses_tenant_id",
                table: "entity_addresses",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_durable_medical_equipment_tenant_id",
                table: "durable_medical_equipment",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_diagnoses_tenant_id",
                table: "diagnoses",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_clinical_notes_tenant_id",
                table: "clinical_notes",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_clinical_encounters_tenant_id",
                table: "clinical_encounters",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_claim_status_logs_tenant_id",
                table: "claim_status_logs",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_chat_messages_tenant_id",
                table: "chat_messages",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_caregiver_links_tenant_id",
                table: "caregiver_links",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_care_threads_tenant_id",
                table: "care_threads",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_care_navigation_cases_tenant_id",
                table: "care_navigation_cases",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_billing_invoices_tenant_id",
                table: "billing_invoices",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_billing_invoice_items_tenant_id",
                table: "billing_invoice_items",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_barrier_logs_tenant_id",
                table: "barrier_logs",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_assessment_responses_tenant_id",
                table: "assessment_responses",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_tenant_id",
                table: "appointments",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_appointment_resources_tenant_id",
                table: "appointment_resources",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_allergies_tenant_id",
                table: "allergies",
                column: "tenant_id");

            migrationBuilder.CreateIndex(
                name: "IX_advance_directives_tenant_id",
                table: "advance_directives",
                column: "tenant_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_z_benefit_claims_tenant_id",
                table: "z_benefit_claims");

            migrationBuilder.DropIndex(
                name: "IX_vital_signs_tenant_id",
                table: "vital_signs");

            migrationBuilder.DropIndex(
                name: "IX_tenant_configurations_tenant_id",
                table: "tenant_configurations");

            migrationBuilder.DropIndex(
                name: "IX_telemetry_logs_tenant_id",
                table: "telemetry_logs");

            migrationBuilder.DropIndex(
                name: "IX_spiritual_assessments_tenant_id",
                table: "spiritual_assessments");

            migrationBuilder.DropIndex(
                name: "IX_smart_phrases_tenant_id",
                table: "smart_phrases");

            migrationBuilder.DropIndex(
                name: "IX_security_audit_logs_tenant_id",
                table: "security_audit_logs");

            migrationBuilder.DropIndex(
                name: "IX_sdoh_assessments_tenant_id",
                table: "sdoh_assessments");

            migrationBuilder.DropIndex(
                name: "IX_schedule_blocks_tenant_id",
                table: "schedule_blocks");

            migrationBuilder.DropIndex(
                name: "IX_questions_tenant_id",
                table: "questions");

            migrationBuilder.DropIndex(
                name: "IX_questionnaires_tenant_id",
                table: "questionnaires");

            migrationBuilder.DropIndex(
                name: "IX_provider_shifts_tenant_id",
                table: "provider_shifts");

            migrationBuilder.DropIndex(
                name: "IX_prescriptions_tenant_id",
                table: "prescriptions");

            migrationBuilder.DropIndex(
                name: "IX_practitioners_tenant_id",
                table: "practitioners");

            migrationBuilder.DropIndex(
                name: "IX_practitioner_service_areas_tenant_id",
                table: "practitioner_service_areas");

            migrationBuilder.DropIndex(
                name: "IX_practitioner_licensures_tenant_id",
                table: "practitioner_licensures");

            migrationBuilder.DropIndex(
                name: "IX_patients_tenant_id",
                table: "patients");

            migrationBuilder.DropIndex(
                name: "IX_patient_phones_tenant_id",
                table: "patient_phones");

            migrationBuilder.DropIndex(
                name: "IX_patient_outreaches_tenant_id",
                table: "patient_outreaches");

            migrationBuilder.DropIndex(
                name: "IX_patient_emails_tenant_id",
                table: "patient_emails");

            migrationBuilder.DropIndex(
                name: "IX_patient_documents_tenant_id",
                table: "patient_documents");

            migrationBuilder.DropIndex(
                name: "IX_patient_contacts_tenant_id",
                table: "patient_contacts");

            migrationBuilder.DropIndex(
                name: "IX_patient_accounts_tenant_id",
                table: "patient_accounts");

            migrationBuilder.DropIndex(
                name: "IX_outreach_scripts_tenant_id",
                table: "outreach_scripts");

            migrationBuilder.DropIndex(
                name: "IX_outreach_contacts_tenant_id",
                table: "outreach_contacts");

            migrationBuilder.DropIndex(
                name: "IX_outreach_activities_tenant_id",
                table: "outreach_activities");

            migrationBuilder.DropIndex(
                name: "IX_navigation_tasks_tenant_id",
                table: "navigation_tasks");

            migrationBuilder.DropIndex(
                name: "IX_magic_tokens_tenant_id",
                table: "magic_tokens");

            migrationBuilder.DropIndex(
                name: "IX_intervention_logs_tenant_id",
                table: "intervention_logs");

            migrationBuilder.DropIndex(
                name: "IX_integration_profiles_tenant_id",
                table: "integration_profiles");

            migrationBuilder.DropIndex(
                name: "IX_health_plans_tenant_id",
                table: "health_plans");

            migrationBuilder.DropIndex(
                name: "IX_facilities_tenant_id",
                table: "facilities");

            migrationBuilder.DropIndex(
                name: "IX_esas_assessments_tenant_id",
                table: "esas_assessments");

            migrationBuilder.DropIndex(
                name: "IX_equipment_deliveries_tenant_id",
                table: "equipment_deliveries");

            migrationBuilder.DropIndex(
                name: "IX_entity_addresses_tenant_id",
                table: "entity_addresses");

            migrationBuilder.DropIndex(
                name: "IX_durable_medical_equipment_tenant_id",
                table: "durable_medical_equipment");

            migrationBuilder.DropIndex(
                name: "IX_diagnoses_tenant_id",
                table: "diagnoses");

            migrationBuilder.DropIndex(
                name: "IX_clinical_notes_tenant_id",
                table: "clinical_notes");

            migrationBuilder.DropIndex(
                name: "IX_clinical_encounters_tenant_id",
                table: "clinical_encounters");

            migrationBuilder.DropIndex(
                name: "IX_claim_status_logs_tenant_id",
                table: "claim_status_logs");

            migrationBuilder.DropIndex(
                name: "IX_chat_messages_tenant_id",
                table: "chat_messages");

            migrationBuilder.DropIndex(
                name: "IX_caregiver_links_tenant_id",
                table: "caregiver_links");

            migrationBuilder.DropIndex(
                name: "IX_care_threads_tenant_id",
                table: "care_threads");

            migrationBuilder.DropIndex(
                name: "IX_care_navigation_cases_tenant_id",
                table: "care_navigation_cases");

            migrationBuilder.DropIndex(
                name: "IX_billing_invoices_tenant_id",
                table: "billing_invoices");

            migrationBuilder.DropIndex(
                name: "IX_billing_invoice_items_tenant_id",
                table: "billing_invoice_items");

            migrationBuilder.DropIndex(
                name: "IX_barrier_logs_tenant_id",
                table: "barrier_logs");

            migrationBuilder.DropIndex(
                name: "IX_assessment_responses_tenant_id",
                table: "assessment_responses");

            migrationBuilder.DropIndex(
                name: "IX_appointments_tenant_id",
                table: "appointments");

            migrationBuilder.DropIndex(
                name: "IX_appointment_resources_tenant_id",
                table: "appointment_resources");

            migrationBuilder.DropIndex(
                name: "IX_allergies_tenant_id",
                table: "allergies");

            migrationBuilder.DropIndex(
                name: "IX_advance_directives_tenant_id",
                table: "advance_directives");

            migrationBuilder.DropColumn(
                name: "next_attempt_utc",
                table: "outbox_messages");

            migrationBuilder.DropColumn(
                name: "retry_count",
                table: "outbox_messages");
        }
    }
}
