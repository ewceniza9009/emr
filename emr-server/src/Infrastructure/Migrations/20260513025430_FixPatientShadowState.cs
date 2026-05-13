using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixPatientShadowState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_care_navigation_cases_patients_patient_id1",
                table: "care_navigation_cases");

            migrationBuilder.DropIndex(
                name: "ix_care_navigation_cases_patient_id1",
                table: "care_navigation_cases");

            migrationBuilder.DropColumn(
                name: "patient_id1",
                table: "care_navigation_cases");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "patient_id1",
                table: "care_navigation_cases",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_care_navigation_cases_patient_id1",
                table: "care_navigation_cases",
                column: "patient_id1");

            migrationBuilder.AddForeignKey(
                name: "fk_care_navigation_cases_patients_patient_id1",
                table: "care_navigation_cases",
                column: "patient_id1",
                principalTable: "patients",
                principalColumn: "patient_id");
        }
    }
}
