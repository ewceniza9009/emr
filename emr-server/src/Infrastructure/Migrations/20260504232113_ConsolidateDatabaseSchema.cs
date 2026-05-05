using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ConsolidateDatabaseSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the separate address table with resilient SQL
            migrationBuilder.Sql("DROP TABLE IF EXISTS address;");

            // Add the inlined address columns to entity_addresses
            migrationBuilder.AddColumn<string>(name: "city", table: "entity_addresses", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "country", table: "entity_addresses", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<double>(name: "latitude", table: "entity_addresses", type: "double precision", nullable: true);
            migrationBuilder.AddColumn<double>(name: "longitude", table: "entity_addresses", type: "double precision", nullable: true);
            migrationBuilder.AddColumn<string>(name: "postal_code", table: "entity_addresses", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "state", table: "entity_addresses", type: "text", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "street", table: "entity_addresses", type: "text", nullable: false, defaultValue: "");

            // Fix SpiritualAssessment mapping with resilient SQL
            migrationBuilder.Sql("ALTER TABLE spiritual_assessments DROP CONSTRAINT IF EXISTS \"fk_spiritual_assessments_clinical_encounters_clinical_encounte~\";");
            migrationBuilder.Sql("ALTER TABLE spiritual_assessments DROP CONSTRAINT IF EXISTS fk_spiritual_assessments_clinical_encounters_clinical_encounte;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_spiritual_assessments_clinical_encounter_encounter_id;");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_spiritual_assessments_ClinicalEncounterEncounterId\";");

            migrationBuilder.Sql("ALTER TABLE spiritual_assessments DROP COLUMN IF EXISTS clinical_encounter_encounter_id;");

            migrationBuilder.CreateIndex(
                name: "ix_spiritual_assessments_encounter_id",
                table: "spiritual_assessments",
                column: "encounter_id");

            migrationBuilder.AddForeignKey(
                name: "fk_spiritual_assessments_clinical_encounters_encounter_id",
                table: "spiritual_assessments",
                column: "encounter_id",
                principalTable: "clinical_encounters",
                principalColumn: "encounter_id",
                onDelete: ReferentialAction.Cascade);

            // Fix IntegrationProfile mapping with resilient SQL
            migrationBuilder.Sql("ALTER TABLE integration_profiles ALTER COLUMN settings_json TYPE jsonb USING settings_json::jsonb;");

            migrationBuilder.AlterColumn<string>(
                name: "partner",
                table: "integration_profiles",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "city", table: "entity_addresses");
            migrationBuilder.DropColumn(name: "country", table: "entity_addresses");
            migrationBuilder.DropColumn(name: "latitude", table: "entity_addresses");
            migrationBuilder.DropColumn(name: "longitude", table: "entity_addresses");
            migrationBuilder.DropColumn(name: "postal_code", table: "entity_addresses");
            migrationBuilder.DropColumn(name: "state", table: "entity_addresses");
            migrationBuilder.DropColumn(name: "street", table: "entity_addresses");
        }
    }
}
