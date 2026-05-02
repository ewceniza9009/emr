using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropStaleAddressColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_address_facilities_FacilityId",
                table: "address");

            migrationBuilder.DropColumn(
                name: "base_address_city",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "base_address_country",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "base_address_latitude",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "base_address_longitude",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "base_address_postal_code",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "base_address_state",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "base_address_street",
                table: "practitioners");

            migrationBuilder.DropColumn(
                name: "home_address_city",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "home_address_country",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "home_address_latitude",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "home_address_longitude",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "home_address_postal_code",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "home_address_state",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "home_address_street",
                table: "patients");

            migrationBuilder.RenameColumn(
                name: "facility_address_street",
                table: "address",
                newName: "street");

            migrationBuilder.RenameColumn(
                name: "facility_address_state",
                table: "address",
                newName: "state");

            migrationBuilder.RenameColumn(
                name: "facility_address_postal_code",
                table: "address",
                newName: "postal_code");

            migrationBuilder.RenameColumn(
                name: "facility_address_longitude",
                table: "address",
                newName: "longitude");

            migrationBuilder.RenameColumn(
                name: "facility_address_latitude",
                table: "address",
                newName: "latitude");

            migrationBuilder.RenameColumn(
                name: "facility_address_country",
                table: "address",
                newName: "country");

            migrationBuilder.RenameColumn(
                name: "facility_address_city",
                table: "address",
                newName: "city");

            migrationBuilder.RenameColumn(
                name: "FacilityId",
                table: "address",
                newName: "EntityAddressId");

            migrationBuilder.AddColumn<string>(
                name: "facility_address_city",
                table: "facilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "facility_address_country",
                table: "facilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "facility_address_latitude",
                table: "facilities",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "facility_address_longitude",
                table: "facilities",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "facility_address_postal_code",
                table: "facilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "facility_address_state",
                table: "facilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "facility_address_street",
                table: "facilities",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "entity_addresses",
                columns: table => new
                {
                    entity_address_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: true),
                    practitioner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    type = table.Column<string>(type: "text", nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_entity_addresses", x => x.entity_address_id);
                    table.ForeignKey(
                        name: "fk_entity_addresses__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_entity_addresses__practitioners_practitioner_id",
                        column: x => x.practitioner_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_entity_addresses_patient_id",
                table: "entity_addresses",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_entity_addresses_practitioner_id",
                table: "entity_addresses",
                column: "practitioner_id");

            migrationBuilder.AddForeignKey(
                name: "FK_address_entity_addresses_EntityAddressId",
                table: "address",
                column: "EntityAddressId",
                principalTable: "entity_addresses",
                principalColumn: "entity_address_id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_address_entity_addresses_EntityAddressId",
                table: "address");

            migrationBuilder.DropTable(
                name: "entity_addresses");

            migrationBuilder.DropColumn(
                name: "facility_address_city",
                table: "facilities");

            migrationBuilder.DropColumn(
                name: "facility_address_country",
                table: "facilities");

            migrationBuilder.DropColumn(
                name: "facility_address_latitude",
                table: "facilities");

            migrationBuilder.DropColumn(
                name: "facility_address_longitude",
                table: "facilities");

            migrationBuilder.DropColumn(
                name: "facility_address_postal_code",
                table: "facilities");

            migrationBuilder.DropColumn(
                name: "facility_address_state",
                table: "facilities");

            migrationBuilder.DropColumn(
                name: "facility_address_street",
                table: "facilities");

            migrationBuilder.RenameColumn(
                name: "street",
                table: "address",
                newName: "facility_address_street");

            migrationBuilder.RenameColumn(
                name: "state",
                table: "address",
                newName: "facility_address_state");

            migrationBuilder.RenameColumn(
                name: "postal_code",
                table: "address",
                newName: "facility_address_postal_code");

            migrationBuilder.RenameColumn(
                name: "longitude",
                table: "address",
                newName: "facility_address_longitude");

            migrationBuilder.RenameColumn(
                name: "latitude",
                table: "address",
                newName: "facility_address_latitude");

            migrationBuilder.RenameColumn(
                name: "country",
                table: "address",
                newName: "facility_address_country");

            migrationBuilder.RenameColumn(
                name: "city",
                table: "address",
                newName: "facility_address_city");

            migrationBuilder.RenameColumn(
                name: "EntityAddressId",
                table: "address",
                newName: "FacilityId");

            migrationBuilder.AddColumn<string>(
                name: "base_address_city",
                table: "practitioners",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "base_address_country",
                table: "practitioners",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "base_address_latitude",
                table: "practitioners",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "base_address_longitude",
                table: "practitioners",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "base_address_postal_code",
                table: "practitioners",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "base_address_state",
                table: "practitioners",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "base_address_street",
                table: "practitioners",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "home_address_city",
                table: "patients",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "home_address_country",
                table: "patients",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "home_address_latitude",
                table: "patients",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "home_address_longitude",
                table: "patients",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "home_address_postal_code",
                table: "patients",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "home_address_state",
                table: "patients",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "home_address_street",
                table: "patients",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_address_facilities_FacilityId",
                table: "address",
                column: "FacilityId",
                principalTable: "facilities",
                principalColumn: "facility_id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
