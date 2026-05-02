using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOutreachContacts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "outreach_contacts",
                columns: table => new
                {
                    outreach_contact_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_outreach_id = table.Column<Guid>(type: "uuid", nullable: false),
                    first_name = table.Column<string>(type: "text", nullable: false),
                    last_name = table.Column<string>(type: "text", nullable: false),
                    relationship = table.Column<int>(type: "integer", nullable: false),
                    phone_number = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    is_primary_contact = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_outreach_contacts", x => x.outreach_contact_id);
                    table.ForeignKey(
                        name: "fk_outreach_contacts__patient_outreaches_patient_outreach_id",
                        column: x => x.patient_outreach_id,
                        principalTable: "patient_outreaches",
                        principalColumn: "patient_outreach_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_outreach_contacts_patient_outreach_id",
                table: "outreach_contacts",
                column: "patient_outreach_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "outreach_contacts");
        }
    }
}
