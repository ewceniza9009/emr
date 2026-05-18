using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAppointmentFacilityRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "facility_id",
                table: "appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_appointments_facility_id",
                table: "appointments",
                column: "facility_id");

            migrationBuilder.AddForeignKey(
                name: "fk_appointments_facilities_facility_id",
                table: "appointments",
                column: "facility_id",
                principalTable: "facilities",
                principalColumn: "facility_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointments_facilities_facility_id",
                table: "appointments");

            migrationBuilder.DropIndex(
                name: "ix_appointments_facility_id",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "facility_id",
                table: "appointments");
        }
    }
}
