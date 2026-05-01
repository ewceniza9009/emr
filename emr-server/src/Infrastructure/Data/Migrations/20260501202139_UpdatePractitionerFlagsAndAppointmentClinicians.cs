using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePractitionerFlagsAndAppointmentClinicians : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AppointmentId",
                table: "practitioners",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCareNavigator",
                table: "practitioners",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSupportingClinician",
                table: "practitioners",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_practitioners_AppointmentId",
                table: "practitioners",
                column: "AppointmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_practitioners_appointments_AppointmentId",
                table: "practitioners",
                column: "AppointmentId",
                principalTable: "appointments",
                principalColumn: "appointment_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_practitioners_appointments_AppointmentId",
                table: "practitioners");

            migrationBuilder.DropIndex(
                name: "IX_practitioners_AppointmentId",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "AppointmentId",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "IsCareNavigator",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "IsSupportingClinician",
                table: "practitioners");
        }
    }
}
