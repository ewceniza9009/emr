using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemShiftSummaryFunction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE OR REPLACE FUNCTION get_system_shift_summary(p_start_date timestamp with time zone, p_end_date timestamp with time zone)
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
        (SELECT count(*)::int FROM ""clinical_encounters"" WHERE ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""clinical_notes"" WHERE ""is_signed"" = false AND ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""diagnoses"" WHERE ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""prescriptions"" WHERE ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""vital_signs"" WHERE ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        0, -- Medications Administered
        0, -- Triage Actions Resolved
        (SELECT count(*)::int FROM ""care_navigation_cases"" WHERE ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""sdoh_assessments"" WHERE ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        (SELECT count(*)::int FROM ""barrier_logs"" WHERE ""created_at"" >= p_start_date AND ""created_at"" < p_end_date),
        ((SELECT count(*)::int FROM ""clinical_encounters"" WHERE ""created_at"" >= p_start_date AND ""created_at"" < p_end_date) * 2.5)::double precision;
END;
$$ LANGUAGE plpgsql;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP FUNCTION IF EXISTS get_system_shift_summary(timestamp with time zone, timestamp with time zone);");
        }
    }
}
