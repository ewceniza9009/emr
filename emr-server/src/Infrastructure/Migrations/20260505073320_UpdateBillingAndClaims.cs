using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBillingAndClaims : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "approved_at",
                table: "z_benefit_claims",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "paid_at",
                table: "z_benefit_claims",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "encounter_id",
                table: "billing_invoices",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_billing_invoices_encounter_id",
                table: "billing_invoices",
                column: "encounter_id");

            migrationBuilder.AddForeignKey(
                name: "fk_billing_invoices_clinical_encounters_encounter_id",
                table: "billing_invoices",
                column: "encounter_id",
                principalTable: "clinical_encounters",
                principalColumn: "encounter_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_billing_invoices_clinical_encounters_encounter_id",
                table: "billing_invoices");

            migrationBuilder.DropIndex(
                name: "ix_billing_invoices_encounter_id",
                table: "billing_invoices");

            migrationBuilder.DropColumn(
                name: "approved_at",
                table: "z_benefit_claims");

            migrationBuilder.DropColumn(
                name: "paid_at",
                table: "z_benefit_claims");

            migrationBuilder.DropColumn(
                name: "encounter_id",
                table: "billing_invoices");
        }
    }
}
