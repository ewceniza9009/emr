using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBiologicalSexType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE patients ALTER COLUMN biological_sex TYPE integer USING (CASE WHEN biological_sex = 'Male' THEN 0 WHEN biological_sex = 'Female' THEN 1 WHEN biological_sex = 'Intersex' THEN 2 WHEN biological_sex = 'Other' THEN 3 ELSE 4 END);");
            migrationBuilder.Sql("ALTER TABLE patient_outreaches ALTER COLUMN biological_sex TYPE integer USING (CASE WHEN biological_sex = 'Male' THEN 0 WHEN biological_sex = 'Female' THEN 1 WHEN biological_sex = 'Intersex' THEN 2 WHEN biological_sex = 'Other' THEN 3 ELSE 4 END);");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE patients ALTER COLUMN biological_sex TYPE character varying(20) USING (CASE WHEN biological_sex = 0 THEN 'Male' WHEN biological_sex = 1 THEN 'Female' WHEN biological_sex = 2 THEN 'Intersex' WHEN biological_sex = 3 THEN 'Other' ELSE 'Unknown' END);");
            migrationBuilder.Sql("ALTER TABLE patient_outreaches ALTER COLUMN biological_sex TYPE text USING (CASE WHEN biological_sex = 0 THEN 'Male' WHEN biological_sex = 1 THEN 'Female' WHEN biological_sex = 2 THEN 'Intersex' WHEN biological_sex = 3 THEN 'Other' ELSE 'Unknown' END);");
        }
    }
}
