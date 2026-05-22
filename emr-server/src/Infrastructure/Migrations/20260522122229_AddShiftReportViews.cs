using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftReportViews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION get_practitioner_shift_summary(p_practitioner_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
RETURNS TABLE (
    TotalEncounters integer,
    UnsignedNotes integer,
    DiagnosesAdded integer,
    PrescriptionsAuthorized integer,
    VitalsLogged integer,
    MedicationsAdministered integer,
    TriageActionsResolved integer,
    CasesTouched integer,
    SdohAssessmentsCompleted integer,
    BarriersMitigated integer,
    SimulatedRvus double precision
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Physicians/NPs
        (SELECT count(*)::int FROM ""clinical_encounters"" WHERE ""practitioner_id"" = p_practitioner_id AND ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""clinical_notes"" WHERE ""author_id"" = p_practitioner_id AND ""is_signed"" = false AND ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""diagnoses"" d JOIN ""clinical_encounters"" ce ON d.""encounter_id"" = ce.""encounter_id"" WHERE ce.""practitioner_id"" = p_practitioner_id AND d.""created_at"" >= p_start_date AND d.""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""prescriptions"" WHERE ""prescribed_by_id"" = p_practitioner_id AND ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        -- Nurses
        (SELECT count(*)::int FROM ""vital_signs"" v JOIN ""clinical_encounters"" ce ON v.""encounter_id"" = ce.""encounter_id"" WHERE ce.""practitioner_id"" = p_practitioner_id AND v.""created_at"" >= p_start_date AND v.""created_at"" < p_end_date),
        0, -- Medications Administered
        0, -- Triage Actions Resolved
        -- Social Workers
        (SELECT count(*)::int FROM ""care_navigation_cases"" WHERE ""navigator_id"" = p_practitioner_id AND ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""sdoh_assessments"" WHERE ""assessor_id"" = p_practitioner_id AND ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""barrier_logs"" b JOIN ""care_navigation_cases"" c ON b.""case_id"" = c.""case_id"" WHERE c.""navigator_id"" = p_practitioner_id AND b.""created_at"" >= p_start_date AND b.""created_at"" < p_end_date),
        -- Simulated RVUs
        ((SELECT count(*)::int FROM ""clinical_encounters"" WHERE ""practitioner_id"" = p_practitioner_id AND ""created_at"" >= p_start_date AND ""created_at"" < p_end_date) * 2.5)::double precision;
END;
$$ LANGUAGE plpgsql;

CREATE MATERIALIZED VIEW vw_system_daily_summary AS
SELECT 
    CURRENT_DATE as ReportDate,
    (SELECT count(*) FROM ""clinical_encounters"") as TotalEncounters,
    (SELECT count(*) FROM ""clinical_notes"" WHERE ""is_signed"" = false) as UnsignedNotes,
    (SELECT count(*) FROM ""diagnoses"") as DiagnosesAdded,
    (SELECT count(*) FROM ""prescriptions"") as PrescriptionsAuthorized,
    (SELECT count(*) FROM ""vital_signs"") as VitalsLogged,
    0 as MedicationsAdministered,
    0 as TriageActionsResolved,
    (SELECT count(*) FROM ""care_navigation_cases"") as CasesTouched,
    (SELECT count(*) FROM ""sdoh_assessments"") as SdohAssessmentsCompleted,
    (SELECT count(*) FROM ""barrier_logs"") as BarriersMitigated,
    ((SELECT count(*) FROM ""clinical_encounters"") * 2.5)::double precision as SimulatedRvus;

CREATE UNIQUE INDEX idx_vw_system_daily_summary ON vw_system_daily_summary (ReportDate);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DROP MATERIALIZED VIEW IF EXISTS vw_system_daily_summary;
DROP FUNCTION IF EXISTS get_practitioner_shift_summary(uuid, timestamp with time zone, timestamp with time zone);
            ");
        }
    }
}
