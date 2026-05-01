using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAppointmentStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Postgres requires an explicit USING clause to cast varchar to integer
            migrationBuilder.Sql("ALTER TABLE appointments ALTER COLUMN status TYPE integer USING (CASE WHEN status = '' OR status IS NULL THEN 0 ELSE 0 END);");
            
            migrationBuilder.AlterColumn<int>(
                name: "status",
                table: "appointments",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "status",
                table: "appointments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldMaxLength: 50);
        }
    }
}
