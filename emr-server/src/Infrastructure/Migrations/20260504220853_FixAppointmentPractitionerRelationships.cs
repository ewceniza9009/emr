using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixAppointmentPractitionerRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointments__practitioners_practitioner_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_practitioners_appointments_appointment_id",
                table: "practitioners");

            migrationBuilder.DropIndex(
                name: "ix_practitioners_appointment_id",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "appointment_id",
                table: "practitioners");

            migrationBuilder.CreateTable(
                name: "appointment_supporting_clinicians",
                columns: table => new
                {
                    AppointmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupportingCliniciansPractitionerId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_appointment_supporting_clinicians", x => new { x.AppointmentId, x.SupportingCliniciansPractitionerId });
                    table.ForeignKey(
                        name: "FK_appointment_supporting_clinicians_appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "appointments",
                        principalColumn: "appointment_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_appointment_supporting_clinicians_practitioners_SupportingC~",
                        column: x => x.SupportingCliniciansPractitionerId,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_appointment_supporting_clinicians_SupportingCliniciansPract~",
                table: "appointment_supporting_clinicians",
                column: "SupportingCliniciansPractitionerId");

            migrationBuilder.AddForeignKey(
                name: "fk_appointments__practitioners_practitioner_id",
                table: "appointments",
                column: "practitioner_id",
                principalTable: "practitioners",
                principalColumn: "practitioner_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_appointments__practitioners_practitioner_id",
                table: "appointments");

            migrationBuilder.DropTable(
                name: "appointment_supporting_clinicians");

            migrationBuilder.AddColumn<Guid>(
                name: "appointment_id",
                table: "practitioners",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_practitioners_appointment_id",
                table: "practitioners",
                column: "appointment_id");

            migrationBuilder.AddForeignKey(
                name: "fk_appointments__practitioners_practitioner_id",
                table: "appointments",
                column: "practitioner_id",
                principalTable: "practitioners",
                principalColumn: "practitioner_id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_practitioners_appointments_appointment_id",
                table: "practitioners",
                column: "appointment_id",
                principalTable: "appointments",
                principalColumn: "appointment_id");
        }
    }
}
