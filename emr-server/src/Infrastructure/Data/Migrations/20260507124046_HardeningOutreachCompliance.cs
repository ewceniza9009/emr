using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class HardeningOutreachCompliance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_active",
                table: "patients",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_do_not_call",
                table: "patient_outreaches",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_opted_out",
                table: "patient_outreaches",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "latest_activity_outcome",
                table: "patient_outreaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "latest_activity_reason",
                table: "patient_outreaches",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "reason",
                table: "outreach_activities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "closed_at",
                table: "care_navigation_cases",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "resolution_notes",
                table: "care_navigation_cases",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_active",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "is_do_not_call",
                table: "patient_outreaches");

            migrationBuilder.DropColumn(
                name: "is_opted_out",
                table: "patient_outreaches");

            migrationBuilder.DropColumn(
                name: "latest_activity_outcome",
                table: "patient_outreaches");

            migrationBuilder.DropColumn(
                name: "latest_activity_reason",
                table: "patient_outreaches");

            migrationBuilder.DropColumn(
                name: "reason",
                table: "outreach_activities");

            migrationBuilder.DropColumn(
                name: "closed_at",
                table: "care_navigation_cases");

            migrationBuilder.DropColumn(
                name: "resolution_notes",
                table: "care_navigation_cases");
        }
    }
}
