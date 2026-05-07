using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSecurityAuditLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "remarks",
                table: "claim_status_logs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EmergencyAccessExpiry",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "security_audit_logs",
                columns: table => new
                {
                    security_audit_log_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "text", nullable: false),
                    actor_user_id = table.Column<string>(type: "text", nullable: false),
                    actor_name = table.Column<string>(type: "text", nullable: false),
                    target_user_id = table.Column<string>(type: "text", nullable: true),
                    target_name = table.Column<string>(type: "text", nullable: true),
                    details = table.Column<string>(type: "text", nullable: true),
                    ip_address = table.Column<string>(type: "text", nullable: true),
                    user_agent = table.Column<string>(type: "text", nullable: true),
                    tenant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_security_audit_logs", x => x.security_audit_log_id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "security_audit_logs");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "schedule_blocks");

            migrationBuilder.DropColumn(
                name: "created_by",
                table: "schedule_blocks");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "schedule_blocks");

            migrationBuilder.DropColumn(
                name: "tenant_id",
                table: "schedule_blocks");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "schedule_blocks");

            migrationBuilder.DropColumn(
                name: "updated_by",
                table: "schedule_blocks");

            migrationBuilder.DropColumn(
                name: "EmergencyAccessExpiry",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<string>(
                name: "remarks",
                table: "claim_status_logs",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
