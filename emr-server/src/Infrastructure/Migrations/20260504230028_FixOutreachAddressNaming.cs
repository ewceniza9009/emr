using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixOutreachAddressNaming : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MailingAddress_Longitude",
                table: "patient_outreaches",
                newName: "mailing_address_longitude");

            migrationBuilder.RenameColumn(
                name: "MailingAddress_Latitude",
                table: "patient_outreaches",
                newName: "mailing_address_latitude");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "mailing_address_longitude",
                table: "patient_outreaches",
                newName: "MailingAddress_Longitude");

            migrationBuilder.RenameColumn(
                name: "mailing_address_latitude",
                table: "patient_outreaches",
                newName: "MailingAddress_Latitude");
        }
    }
}
