using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPatientOutreachDemographics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "biological_sex",
                table: "patient_outreaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "civil_status",
                table: "patient_outreaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "date_of_birth",
                table: "patient_outreaches",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "gender_identity",
                table: "patient_outreaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "language",
                table: "patient_outreaches",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "biological_sex",
                table: "patient_outreaches");

            migrationBuilder.DropColumn(
                name: "civil_status",
                table: "patient_outreaches");

            migrationBuilder.DropColumn(
                name: "date_of_birth",
                table: "patient_outreaches");

            migrationBuilder.DropColumn(
                name: "gender_identity",
                table: "patient_outreaches");

            migrationBuilder.DropColumn(
                name: "language",
                table: "patient_outreaches");
        }
    }
}
