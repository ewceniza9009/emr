using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HardenJoinTableMapping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_appointment_supporting_clinicians_appointments_AppointmentId",
                table: "appointment_supporting_clinicians");

            migrationBuilder.DropForeignKey(
                name: "FK_appointment_supporting_clinicians_practitioners_SupportingC~",
                table: "appointment_supporting_clinicians");

            migrationBuilder.RenameColumn(
                name: "SupportingCliniciansPractitionerId",
                table: "appointment_supporting_clinicians",
                newName: "practitioner_id");

            migrationBuilder.RenameColumn(
                name: "AppointmentId",
                table: "appointment_supporting_clinicians",
                newName: "appointment_id");

            migrationBuilder.RenameIndex(
                name: "IX_appointment_supporting_clinicians_SupportingCliniciansPract~",
                table: "appointment_supporting_clinicians",
                newName: "IX_appointment_supporting_clinicians_practitioner_id");

            migrationBuilder.AddForeignKey(
                name: "FK_appointment_supporting_clinicians_appointments_appointment_~",
                table: "appointment_supporting_clinicians",
                column: "appointment_id",
                principalTable: "appointments",
                principalColumn: "appointment_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_appointment_supporting_clinicians_practitioners_practitione~",
                table: "appointment_supporting_clinicians",
                column: "practitioner_id",
                principalTable: "practitioners",
                principalColumn: "practitioner_id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_appointment_supporting_clinicians_appointments_appointment_~",
                table: "appointment_supporting_clinicians");

            migrationBuilder.DropForeignKey(
                name: "FK_appointment_supporting_clinicians_practitioners_practitione~",
                table: "appointment_supporting_clinicians");

            migrationBuilder.RenameColumn(
                name: "practitioner_id",
                table: "appointment_supporting_clinicians",
                newName: "SupportingCliniciansPractitionerId");

            migrationBuilder.RenameColumn(
                name: "appointment_id",
                table: "appointment_supporting_clinicians",
                newName: "AppointmentId");

            migrationBuilder.RenameIndex(
                name: "IX_appointment_supporting_clinicians_practitioner_id",
                table: "appointment_supporting_clinicians",
                newName: "IX_appointment_supporting_clinicians_SupportingCliniciansPract~");

            migrationBuilder.AddForeignKey(
                name: "FK_appointment_supporting_clinicians_appointments_AppointmentId",
                table: "appointment_supporting_clinicians",
                column: "AppointmentId",
                principalTable: "appointments",
                principalColumn: "appointment_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_appointment_supporting_clinicians_practitioners_SupportingC~",
                table: "appointment_supporting_clinicians",
                column: "SupportingCliniciansPractitionerId",
                principalTable: "practitioners",
                principalColumn: "practitioner_id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
