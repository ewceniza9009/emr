using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGeospatialScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SignatureHash",
                table: "Prescriptions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "SignedAt",
                table: "Prescriptions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "BaseLatitude",
                table: "practitioners",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "BaseLongitude",
                table: "practitioners",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Position",
                table: "practitioners",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "patients",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "patients",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Facilities",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Facilities",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PractitionerId",
                table: "appointments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProviderShifts",
                columns: table => new
                {
                    ProviderShiftId = table.Column<Guid>(type: "uuid", nullable: false),
                    PractitionerId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayOfWeek = table.Column<int>(type: "integer", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProviderShifts", x => x.ProviderShiftId);
                    table.ForeignKey(
                        name: "FK_ProviderShifts_practitioners_PractitionerId",
                        column: x => x.PractitionerId,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_appointments_PractitionerId",
                table: "appointments",
                column: "PractitionerId");

            migrationBuilder.CreateIndex(
                name: "IX_ProviderShifts_PractitionerId",
                table: "ProviderShifts",
                column: "PractitionerId");

            migrationBuilder.AddForeignKey(
                name: "FK_appointments_practitioners_PractitionerId",
                table: "appointments",
                column: "PractitionerId",
                principalTable: "practitioners",
                principalColumn: "practitioner_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_appointments_practitioners_PractitionerId",
                table: "appointments");

            migrationBuilder.DropTable(
                name: "ProviderShifts");

            migrationBuilder.DropIndex(
                name: "IX_appointments_PractitionerId",
                table: "appointments");

            migrationBuilder.DropColumn(
                name: "SignatureHash",
                table: "Prescriptions");

            migrationBuilder.DropColumn(
                name: "SignedAt",
                table: "Prescriptions");

            migrationBuilder.DropColumn(
                name: "BaseLatitude",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "BaseLongitude",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "Position",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Facilities");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Facilities");

            migrationBuilder.DropColumn(
                name: "PractitionerId",
                table: "appointments");
        }
    }
}
