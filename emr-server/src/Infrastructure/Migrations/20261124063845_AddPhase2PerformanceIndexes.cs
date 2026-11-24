using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase2PerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The original indexes were created with pascal-case IX_* names by the initial
            // migration, while later EF snapshots use lower-case ix_* names. Drop both
            // variants so this migration works on fresh and already-migrated databases.
            migrationBuilder.Sql(@"
DROP INDEX IF EXISTS ix_practitioners_npi_number;
DROP INDEX IF EXISTS ""IX_practitioners_npi_number"";
DROP INDEX IF EXISTS ix_practitioners_prc_license_number;
DROP INDEX IF EXISTS ""IX_practitioners_prc_license_number"";
DROP INDEX IF EXISTS ix_patients_mrn;
DROP INDEX IF EXISTS ""IX_patients_mrn"";
DROP INDEX IF EXISTS ix_patients_philhealth_number;
DROP INDEX IF EXISTS ""IX_patients_philhealth_number"";
DROP INDEX IF EXISTS ix_durable_medical_equipment_serial_number;
DROP INDEX IF EXISTS ""IX_durable_medical_equipment_serial_number"";
DROP INDEX IF EXISTS ix_billing_invoices_invoice_number;
DROP INDEX IF EXISTS ""IX_billing_invoices_invoice_number"";
            ");

            migrationBuilder.CreateIndex(
                name: "ix_practitioners_tenant_npi_number",
                table: "practitioners",
                columns: new[] { "tenant_id", "npi_number" },
                unique: true,
                filter: "npi_number IS NOT NULL AND is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_practitioners_tenant_prc_license_number",
                table: "practitioners",
                columns: new[] { "tenant_id", "prc_license_number" },
                unique: true,
                filter: "prc_license_number IS NOT NULL AND is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_patients_tenant_mrn",
                table: "patients",
                columns: new[] { "tenant_id", "mrn" },
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_patients_tenant_philhealth_number",
                table: "patients",
                columns: new[] { "tenant_id", "philhealth_number" },
                unique: true,
                filter: "philhealth_number IS NOT NULL AND is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_dme_tenant_serial_number",
                table: "durable_medical_equipment",
                columns: new[] { "tenant_id", "serial_number" },
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "ix_billing_invoices_tenant_invoice_number",
                table: "billing_invoices",
                columns: new[] { "tenant_id", "invoice_number" },
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.Sql(@"
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN search indexes matching case-insensitive directory & fallback search predicates
CREATE INDEX IF NOT EXISTS ix_patients_search_trgm
    ON patients USING gin (LOWER(last_name) gin_trgm_ops, LOWER(first_name) gin_trgm_ops, LOWER(mrn) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_patient_outreaches_search_trgm
    ON patient_outreaches USING gin (LOWER(last_name) gin_trgm_ops, LOWER(first_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_patient_phones_number_trgm
    ON patient_phones USING gin (LOWER(phone_number) gin_trgm_ops);

-- Partial index for 5-second Outbox polling hot path
CREATE INDEX IF NOT EXISTS ix_outbox_messages_unprocessed
    ON outbox_messages (created_on_utc, next_attempt_utc)
    WHERE processed_on_utc IS NULL AND retry_count < 5;

-- Authentication & Notification hot-path indexes
CREATE INDEX IF NOT EXISTS ix_magic_tokens_token_hash
    ON magic_tokens (token_hash)
    WHERE is_used = false AND is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_notifications_user_unread
    ON notifications (user_id, is_read, priority DESC, created_at DESC)
    WHERE is_deleted = false;

-- Scheduling, Triage & Clinical timeline composite indexes
CREATE INDEX IF NOT EXISTS ix_appointments_tenant_practitioner_window
    ON appointments (tenant_id, practitioner_id, scheduled_start, scheduled_end)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_appointments_tenant_start_status
    ON appointments (tenant_id, scheduled_start DESC, status)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_appointments_patient_start
    ON appointments (patient_id, status, scheduled_start DESC)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_esas_assessments_patient_assessed_desc
    ON esas_assessments (patient_id, assessed_at DESC)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_clinical_encounters_tenant_patient_date_desc
    ON clinical_encounters (tenant_id, patient_id, encounter_date DESC)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_vital_signs_encounter_recorded_desc
    ON vital_signs (encounter_id, recorded_at DESC)
    WHERE is_deleted = false;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP INDEX IF EXISTS ix_vital_signs_encounter_recorded_desc;
DROP INDEX IF EXISTS ix_clinical_encounters_tenant_patient_date_desc;
DROP INDEX IF EXISTS ix_esas_assessments_patient_assessed_desc;
DROP INDEX IF EXISTS ix_appointments_patient_start;
DROP INDEX IF EXISTS ix_appointments_tenant_start_status;
DROP INDEX IF EXISTS ix_appointments_tenant_practitioner_window;
DROP INDEX IF EXISTS ix_notifications_user_unread;
DROP INDEX IF EXISTS ix_magic_tokens_token_hash;
DROP INDEX IF EXISTS ix_outbox_messages_unprocessed;
DROP INDEX IF EXISTS ix_patient_phones_number_trgm;
DROP INDEX IF EXISTS ix_patient_outreaches_search_trgm;
DROP INDEX IF EXISTS ix_patients_search_trgm;
            ");
            migrationBuilder.Sql(@"
DROP INDEX IF EXISTS ix_practitioners_tenant_npi_number;
DROP INDEX IF EXISTS ix_practitioners_tenant_prc_license_number;
DROP INDEX IF EXISTS ix_patients_tenant_mrn;
DROP INDEX IF EXISTS ix_patients_tenant_philhealth_number;
DROP INDEX IF EXISTS ix_dme_tenant_serial_number;
DROP INDEX IF EXISTS ix_billing_invoices_tenant_invoice_number;

CREATE UNIQUE INDEX IF NOT EXISTS ""IX_practitioners_npi_number""
    ON practitioners (npi_number);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_practitioners_prc_license_number""
    ON practitioners (prc_license_number);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_patients_mrn""
    ON patients (mrn);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_patients_philhealth_number""
    ON patients (philhealth_number);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_durable_medical_equipment_serial_number""
    ON durable_medical_equipment (serial_number);
CREATE UNIQUE INDEX IF NOT EXISTS ""IX_billing_invoices_invoice_number""
    ON billing_invoices (invoice_number);
            ");
        }
    }
}
