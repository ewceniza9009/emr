using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    public partial class FinalizeClinicalTenancy : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use raw SQL with IF NOT EXISTS to handle cases where columns were manually added earlier
            // 1. TENANT ID
            migrationBuilder.Sql("ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE schedule_blocks ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE patients ADD COLUMN IF NOT EXISTS tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000000' NOT NULL;");

            // 2. AUDIT COLUMNS (BaseEntity) for ScheduleBlocks
            migrationBuilder.Sql("ALTER TABLE schedule_blocks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE schedule_blocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;");
            migrationBuilder.Sql("ALTER TABLE schedule_blocks ADD COLUMN IF NOT EXISTS created_by TEXT;");
            migrationBuilder.Sql("ALTER TABLE schedule_blocks ADD COLUMN IF NOT EXISTS updated_by TEXT;");
            migrationBuilder.Sql("ALTER TABLE schedule_blocks ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;");

            // 3. AUDIT COLUMNS for Appointments (Just in case)
            migrationBuilder.Sql("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;");
            migrationBuilder.Sql("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "tenant_id", table: "practitioners");
            migrationBuilder.DropColumn(name: "tenant_id", table: "schedule_blocks");
            migrationBuilder.DropColumn(name: "tenant_id", table: "appointments");
            migrationBuilder.DropColumn(name: "tenant_id", table: "patients");

            migrationBuilder.DropColumn(name: "created_at", table: "schedule_blocks");
            migrationBuilder.DropColumn(name: "is_deleted", table: "schedule_blocks");
            migrationBuilder.DropColumn(name: "created_at", table: "appointments");
            migrationBuilder.DropColumn(name: "is_deleted", table: "appointments");
        }
    }
}
