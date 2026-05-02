using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateNew : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    PractitionerId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: true),
                    SecurityStamp = table.Column<string>(type: "text", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "text", nullable: true),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "durable_medical_equipment",
                columns: table => new
                {
                    equipment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    serial_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    model_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    equipment_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    last_maintenance_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_durable_medical_equipment", x => x.equipment_id);
                });

            migrationBuilder.CreateTable(
                name: "facilities",
                columns: table => new
                {
                    facility_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    contact_person = table.Column<string>(type: "text", nullable: true),
                    contact_phone = table.Column<string>(type: "text", nullable: true),
                    contact_email = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_facilities", x => x.facility_id);
                });

            migrationBuilder.CreateTable(
                name: "health_plans",
                columns: table => new
                {
                    health_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    code = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_health_plans", x => x.health_plan_id);
                });

            migrationBuilder.CreateTable(
                name: "integration_profiles",
                columns: table => new
                {
                    integration_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    partner = table.Column<int>(type: "integer", nullable: false),
                    api_key = table.Column<string>(type: "text", nullable: false),
                    base_url = table.Column<string>(type: "text", nullable: true),
                    webhook_secret = table.Column<string>(type: "text", nullable: true),
                    last_sync_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    settings_json = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_integration_profiles", x => x.integration_profile_id);
                });

            migrationBuilder.CreateTable(
                name: "medications",
                columns: table => new
                {
                    medication_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    strength = table.Column<string>(type: "text", nullable: false),
                    default_route = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_medications", x => x.medication_id);
                });

            migrationBuilder.CreateTable(
                name: "outreach_scripts",
                columns: table => new
                {
                    outreach_script_id = table.Column<Guid>(type: "uuid", nullable: false),
                    location_name = table.Column<string>(type: "text", nullable: false),
                    postal_code = table.Column<string>(type: "text", nullable: false),
                    script_title = table.Column<string>(type: "text", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    is_default = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_outreach_scripts", x => x.outreach_script_id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    ClaimType = table.Column<string>(type: "text", nullable: true),
                    ClaimValue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    ProviderKey = table.Column<string>(type: "text", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    RoleId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    LoginProvider = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "telemetry_logs",
                columns: table => new
                {
                    log_id = table.Column<Guid>(type: "uuid", nullable: false),
                    equipment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sensor_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sensor_value = table.Column<decimal>(type: "numeric(12,4)", nullable: false),
                    unit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    recorded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_telemetry_logs", x => x.log_id);
                    table.ForeignKey(
                        name: "fk_telemetry_logs_durable_medical_equipment_equipment_temp_id1",
                        column: x => x.equipment_id,
                        principalTable: "durable_medical_equipment",
                        principalColumn: "equipment_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "address",
                columns: table => new
                {
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    facility_address_street = table.Column<string>(type: "text", nullable: false),
                    facility_address_city = table.Column<string>(type: "text", nullable: false),
                    facility_address_state = table.Column<string>(type: "text", nullable: false),
                    facility_address_postal_code = table.Column<string>(type: "text", nullable: false),
                    facility_address_country = table.Column<string>(type: "text", nullable: false),
                    facility_address_latitude = table.Column<double>(type: "double precision", nullable: true),
                    facility_address_longitude = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_address", x => x.FacilityId);
                    table.ForeignKey(
                        name: "FK_address_facilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "facilities",
                        principalColumn: "facility_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "patients",
                columns: table => new
                {
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    external_id = table.Column<string>(type: "text", nullable: true),
                    mrn = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    dob = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    biological_sex = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    gender_identity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    philhealth_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    home_address_street = table.Column<string>(type: "text", nullable: false),
                    home_address_city = table.Column<string>(type: "text", nullable: false),
                    home_address_state = table.Column<string>(type: "text", nullable: false),
                    home_address_postal_code = table.Column<string>(type: "text", nullable: false),
                    home_address_country = table.Column<string>(type: "text", nullable: false),
                    home_address_latitude = table.Column<double>(type: "double precision", nullable: true),
                    home_address_longitude = table.Column<double>(type: "double precision", nullable: true),
                    health_plan_id = table.Column<Guid>(type: "uuid", nullable: true),
                    facility_id = table.Column<Guid>(type: "uuid", nullable: true),
                    communication_status = table.Column<int>(type: "integer", nullable: true),
                    tech_access = table.Column<int>(type: "integer", nullable: true),
                    barriers_to_care = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_patients", x => x.patient_id);
                    table.ForeignKey(
                        name: "fk_patients_facilities_facility_id",
                        column: x => x.facility_id,
                        principalTable: "facilities",
                        principalColumn: "facility_id");
                    table.ForeignKey(
                        name: "fk_patients_health_plans_health_plan_id",
                        column: x => x.health_plan_id,
                        principalTable: "health_plans",
                        principalColumn: "health_plan_id");
                });

            migrationBuilder.CreateTable(
                name: "advance_directives",
                columns: table => new
                {
                    advance_directive_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    document_url = table.Column<string>(type: "text", nullable: true),
                    effective_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_advance_directives", x => x.advance_directive_id);
                    table.ForeignKey(
                        name: "fk_advance_directives__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "allergies",
                columns: table => new
                {
                    allergy_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    allergen = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    reaction = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    identified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_allergies", x => x.allergy_id);
                    table.ForeignKey(
                        name: "fk_allergies__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "patient_contacts",
                columns: table => new
                {
                    contact_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    relationship = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    is_primary_contact = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    has_power_of_attorney = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_contacts", x => x.contact_id);
                    table.ForeignKey(
                        name: "fk_patient_contacts_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "patient_emails",
                columns: table => new
                {
                    email_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email_address = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    email_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_emails", x => x.email_id);
                    table.ForeignKey(
                        name: "fk_patient_emails_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "patient_phones",
                columns: table => new
                {
                    phone_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    phone_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_phones", x => x.phone_id);
                    table.ForeignKey(
                        name: "fk_patient_phones_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "z_benefit_claims",
                columns: table => new
                {
                    claim_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    philhealth_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    package_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_z_benefit_claims", x => x.claim_id);
                    table.ForeignKey(
                        name: "fk_z_benefit_claims_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "billing_invoices",
                columns: table => new
                {
                    invoice_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_id = table.Column<Guid>(type: "uuid", nullable: true),
                    invoice_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    subtotal_amount = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    covered_amount = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    patient_responsibility = table.Column<decimal>(type: "numeric(12,2)", nullable: false),
                    generated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    due_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_billing_invoices", x => x.invoice_id);
                    table.ForeignKey(
                        name: "fk_billing_invoices__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_billing_invoices_z_benefit_claims_claim_temp_id",
                        column: x => x.claim_id,
                        principalTable: "z_benefit_claims",
                        principalColumn: "claim_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "claim_status_logs",
                columns: table => new
                {
                    log_id = table.Column<Guid>(type: "uuid", nullable: false),
                    claim_id = table.Column<Guid>(type: "uuid", nullable: false),
                    previous_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    new_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    changed_by = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    remarks = table.Column<string>(type: "text", nullable: false),
                    changed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_claim_status_logs", x => x.log_id);
                    table.ForeignKey(
                        name: "fk_claim_status_logs_z_benefit_claims_claim_temp_id1",
                        column: x => x.claim_id,
                        principalTable: "z_benefit_claims",
                        principalColumn: "claim_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "appointment_resources",
                columns: table => new
                {
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    block_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_appointment_resources", x => new { x.appointment_id, x.block_id });
                });

            migrationBuilder.CreateTable(
                name: "appointments",
                columns: table => new
                {
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    visit_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<int>(type: "integer", maxLength: 50, nullable: false),
                    scheduled_start = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    scheduled_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    modality = table.Column<string>(type: "text", nullable: false),
                    meeting_link = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    practitioner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    travel_time_minutes = table.Column<double>(type: "double precision", nullable: true),
                    distance_in_miles = table.Column<double>(type: "double precision", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_appointments", x => x.appointment_id);
                    table.ForeignKey(
                        name: "fk_appointments__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "practitioners",
                columns: table => new
                {
                    practitioner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    prc_license_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    npi_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    position = table.Column<string>(type: "text", nullable: false),
                    is_care_navigator = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_supporting_clinician = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    base_address_street = table.Column<string>(type: "text", nullable: false),
                    base_address_city = table.Column<string>(type: "text", nullable: false),
                    base_address_state = table.Column<string>(type: "text", nullable: false),
                    base_address_postal_code = table.Column<string>(type: "text", nullable: false),
                    base_address_country = table.Column<string>(type: "text", nullable: false),
                    base_address_latitude = table.Column<double>(type: "double precision", nullable: true),
                    base_address_longitude = table.Column<double>(type: "double precision", nullable: true),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_practitioners", x => x.practitioner_id);
                    table.ForeignKey(
                        name: "fk_practitioners_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "appointment_id");
                });

            migrationBuilder.CreateTable(
                name: "care_navigation_cases",
                columns: table => new
                {
                    case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    navigator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    acuity_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    opened_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_care_navigation_cases", x => x.case_id);
                    table.ForeignKey(
                        name: "fk_care_navigation_cases__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_care_navigation_cases__practitioners_navigator_id",
                        column: x => x.navigator_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "clinical_encounters",
                columns: table => new
                {
                    encounter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    practitioner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    type = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    pps_score = table.Column<int>(type: "integer", nullable: true),
                    encounter_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    admitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    discharged_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    chief_complaint = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clinical_encounters", x => x.encounter_id);
                    table.ForeignKey(
                        name: "fk_clinical_encounters__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_clinical_encounters__practitioners_practitioner_id",
                        column: x => x.practitioner_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_clinical_encounters_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "appointment_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "patient_outreaches",
                columns: table => new
                {
                    patient_outreach_id = table.Column<Guid>(type: "uuid", nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    mailing_address_street = table.Column<string>(type: "text", nullable: false),
                    mailing_address_city = table.Column<string>(type: "text", nullable: false),
                    mailing_address_state = table.Column<string>(type: "text", nullable: false),
                    mailing_address_postal_code = table.Column<string>(type: "text", nullable: false),
                    mailing_address_country = table.Column<string>(type: "text", nullable: false),
                    MailingAddress_Latitude = table.Column<double>(type: "double precision", nullable: true),
                    MailingAddress_Longitude = table.Column<double>(type: "double precision", nullable: true),
                    referral_source = table.Column<string>(type: "text", nullable: true),
                    primary_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    primary_email = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    next_follow_up_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    is_accepted = table.Column<bool>(type: "boolean", nullable: false),
                    orientation_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    selected_modality = table.Column<int>(type: "integer", nullable: true),
                    health_plan_id = table.Column<Guid>(type: "uuid", nullable: true),
                    communication_status = table.Column<int>(type: "integer", nullable: true),
                    tech_access = table.Column<int>(type: "integer", nullable: true),
                    disposition = table.Column<int>(type: "integer", nullable: false),
                    barriers_to_care = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    last_activity_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    call_attempt_count = table.Column<int>(type: "integer", nullable: false),
                    assigned_practitioner_id = table.Column<Guid>(type: "uuid", nullable: true),
                    enrolled_patient_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_patient_outreaches", x => x.patient_outreach_id);
                    table.ForeignKey(
                        name: "fk_patient_outreaches__practitioners_assigned_practitioner_id",
                        column: x => x.assigned_practitioner_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id");
                    table.ForeignKey(
                        name: "fk_patient_outreaches_health_plans_health_plan_id",
                        column: x => x.health_plan_id,
                        principalTable: "health_plans",
                        principalColumn: "health_plan_id");
                    table.ForeignKey(
                        name: "fk_patient_outreaches_patients_enrolled_patient_id",
                        column: x => x.enrolled_patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id");
                });

            migrationBuilder.CreateTable(
                name: "practitioner_licensures",
                columns: table => new
                {
                    licensure_id = table.Column<Guid>(type: "uuid", nullable: false),
                    practitioner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    license_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    state = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    expiry_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practitioner_licensures", x => x.licensure_id);
                    table.ForeignKey(
                        name: "fk_practitioner_licensures_practitioners_practitioner_id",
                        column: x => x.practitioner_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "practitioner_service_areas",
                columns: table => new
                {
                    service_area_id = table.Column<Guid>(type: "uuid", nullable: false),
                    practitioner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    zip_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    county = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practitioner_service_areas", x => x.service_area_id);
                    table.ForeignKey(
                        name: "fk_practitioner_service_areas_practitioners_practitioner_id",
                        column: x => x.practitioner_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "prescriptions",
                columns: table => new
                {
                    prescription_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    medication_id = table.Column<Guid>(type: "uuid", nullable: false),
                    prescribed_by_id = table.Column<Guid>(type: "uuid", nullable: false),
                    dose = table.Column<string>(type: "text", nullable: false),
                    frequency = table.Column<string>(type: "text", nullable: false),
                    route = table.Column<int>(type: "integer", nullable: false),
                    indications = table.Column<string>(type: "text", nullable: true),
                    start_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    end_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    signature_hash = table.Column<string>(type: "text", nullable: true),
                    signed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prescriptions", x => x.prescription_id);
                    table.ForeignKey(
                        name: "fk_prescriptions_medications_medication_id",
                        column: x => x.medication_id,
                        principalTable: "medications",
                        principalColumn: "medication_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_prescriptions_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_prescriptions_practitioners_prescribed_by_id",
                        column: x => x.prescribed_by_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "provider_shifts",
                columns: table => new
                {
                    provider_shift_id = table.Column<Guid>(type: "uuid", nullable: false),
                    practitioner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    day_of_week = table.Column<int>(type: "integer", nullable: false),
                    start_time = table.Column<TimeSpan>(type: "interval", nullable: false),
                    end_time = table.Column<TimeSpan>(type: "interval", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_provider_shifts", x => x.provider_shift_id);
                    table.ForeignKey(
                        name: "fk_provider_shifts_practitioners_practitioner_id",
                        column: x => x.practitioner_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "schedule_blocks",
                columns: table => new
                {
                    block_id = table.Column<Guid>(type: "uuid", nullable: false),
                    practitioner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_time = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    end_time = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schedule_blocks", x => x.block_id);
                    table.ForeignKey(
                        name: "fk_schedule_blocks_practitioners_practitioner_id",
                        column: x => x.practitioner_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "barrier_logs",
                columns: table => new
                {
                    barrier_id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    barrier_category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_barrier_logs", x => x.barrier_id);
                    table.ForeignKey(
                        name: "fk_barrier_logs__care_navigation_cases_care_navigation_case_temp_~",
                        column: x => x.case_id,
                        principalTable: "care_navigation_cases",
                        principalColumn: "case_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "intervention_logs",
                columns: table => new
                {
                    intervention_id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action_taken = table.Column<string>(type: "text", nullable: false),
                    logged_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intervention_logs", x => x.intervention_id);
                    table.ForeignKey(
                        name: "fk_intervention_logs_care_navigation_cases_care_navigation_cas~",
                        column: x => x.case_id,
                        principalTable: "care_navigation_cases",
                        principalColumn: "case_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "navigation_tasks",
                columns: table => new
                {
                    task_id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assigned_to = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    due_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_navigation_tasks", x => x.task_id);
                    table.ForeignKey(
                        name: "fk_navigation_tasks__practitioners_assigned_to_id",
                        column: x => x.assigned_to,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_navigation_tasks_care_navigation_cases_care_navigation_case~",
                        column: x => x.case_id,
                        principalTable: "care_navigation_cases",
                        principalColumn: "case_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sdoh_assessments",
                columns: table => new
                {
                    sdoh_id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    assessor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    food_insecurity = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    housing_instability = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    transportation_barrier = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    financial_toxicity = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    assessed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sdoh_assessments", x => x.sdoh_id);
                    table.ForeignKey(
                        name: "fk_sdoh_assessments_care_navigation_cases_care_navigation_case~",
                        column: x => x.case_id,
                        principalTable: "care_navigation_cases",
                        principalColumn: "case_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_sdoh_assessments_practitioners_assessor_id",
                        column: x => x.assessor_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "clinical_notes",
                columns: table => new
                {
                    note_id = table.Column<Guid>(type: "uuid", nullable: false),
                    encounter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    author_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    is_signed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clinical_notes", x => x.note_id);
                    table.ForeignKey(
                        name: "fk_clinical_notes__practitioners_author_id",
                        column: x => x.author_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_clinical_notes_clinical_encounters_encounter_temp_id",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "diagnoses",
                columns: table => new
                {
                    diagnosis_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    encounter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    icd10_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    is_primary = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    diagnosed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_diagnoses", x => x.diagnosis_id);
                    table.ForeignKey(
                        name: "fk_diagnoses__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_diagnoses_clinical_encounters_encounter_temp_id1",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "equipment_deliveries",
                columns: table => new
                {
                    delivery_id = table.Column<Guid>(type: "uuid", nullable: false),
                    equipment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    encounter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    requested_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    delivered_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    delivery_address = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment_deliveries", x => x.delivery_id);
                    table.ForeignKey(
                        name: "fk_equipment_deliveries__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_equipment_deliveries_clinical_encounters_encounter_temp_id3",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_equipment_deliveries_durable_medical_equipment_equipment_te~",
                        column: x => x.equipment_id,
                        principalTable: "durable_medical_equipment",
                        principalColumn: "equipment_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "esas_assessments",
                columns: table => new
                {
                    assessment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    encounter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    pain = table.Column<int>(type: "integer", nullable: false),
                    tiredness = table.Column<int>(type: "integer", nullable: false),
                    drowsiness = table.Column<int>(type: "integer", nullable: false),
                    nausea = table.Column<int>(type: "integer", nullable: false),
                    lack_of_appetite = table.Column<int>(type: "integer", nullable: false),
                    shortness_of_breath = table.Column<int>(type: "integer", nullable: false),
                    depression = table.Column<int>(type: "integer", nullable: false),
                    anxiety = table.Column<int>(type: "integer", nullable: false),
                    wellbeing = table.Column<int>(type: "integer", nullable: false),
                    assessed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_esas_assessments", x => x.assessment_id);
                    table.ForeignKey(
                        name: "fk_esas_assessments__patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_esas_assessments_clinical_encounters_encounter_temp_id4",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "vital_signs",
                columns: table => new
                {
                    vital_id = table.Column<Guid>(type: "uuid", nullable: false),
                    encounter_id = table.Column<Guid>(type: "uuid", nullable: false),
                    heart_rate = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    blood_pressure_systolic = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    blood_pressure_diastolic = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    respiratory_rate = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    temperature = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    oxygen_saturation = table.Column<decimal>(type: "numeric(5,2)", nullable: true),
                    recorded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vital_signs", x => x.vital_id);
                    table.ForeignKey(
                        name: "fk_vital_signs_clinical_encounters_encounter_temp_id2",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "outreach_activities",
                columns: table => new
                {
                    outreach_activity_id = table.Column<Guid>(type: "uuid", nullable: false),
                    outreach_id = table.Column<Guid>(type: "uuid", nullable: false),
                    practitioner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    method = table.Column<int>(type: "integer", nullable: false),
                    outcome = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    activity_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "text", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_outreach_activities", x => x.outreach_activity_id);
                    table.ForeignKey(
                        name: "fk_outreach_activities__patient_outreaches_outreach_id",
                        column: x => x.outreach_id,
                        principalTable: "patient_outreaches",
                        principalColumn: "patient_outreach_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_outreach_activities__practitioners_practitioner_id",
                        column: x => x.practitioner_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_advance_directives_patient_id",
                table: "advance_directives",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_allergies_patient_id",
                table: "allergies",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_appointment_resources_block_id",
                table: "appointment_resources",
                column: "block_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointments_patient_id",
                table: "appointments",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_appointments_practitioner_id",
                table: "appointments",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_barrier_logs_case_id",
                table: "barrier_logs",
                column: "case_id");

            migrationBuilder.CreateIndex(
                name: "IX_billing_invoices_claim_id",
                table: "billing_invoices",
                column: "claim_id");

            migrationBuilder.CreateIndex(
                name: "IX_billing_invoices_invoice_number",
                table: "billing_invoices",
                column: "invoice_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_billing_invoices_patient_id",
                table: "billing_invoices",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_care_navigation_cases_navigator_id",
                table: "care_navigation_cases",
                column: "navigator_id");

            migrationBuilder.CreateIndex(
                name: "ix_care_navigation_cases_patient_id",
                table: "care_navigation_cases",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_claim_status_logs_claim_id",
                table: "claim_status_logs",
                column: "claim_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_encounters_appointment_id",
                table: "clinical_encounters",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_encounters_patient_id",
                table: "clinical_encounters",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_encounters_practitioner_id",
                table: "clinical_encounters",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "ix_clinical_notes_author_id",
                table: "clinical_notes",
                column: "author_id");

            migrationBuilder.CreateIndex(
                name: "IX_clinical_notes_encounter_id",
                table: "clinical_notes",
                column: "encounter_id");

            migrationBuilder.CreateIndex(
                name: "IX_diagnoses_encounter_id",
                table: "diagnoses",
                column: "encounter_id");

            migrationBuilder.CreateIndex(
                name: "ix_diagnoses_patient_id",
                table: "diagnoses",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_durable_medical_equipment_serial_number",
                table: "durable_medical_equipment",
                column: "serial_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_equipment_deliveries_encounter_id",
                table: "equipment_deliveries",
                column: "encounter_id");

            migrationBuilder.CreateIndex(
                name: "IX_equipment_deliveries_equipment_id",
                table: "equipment_deliveries",
                column: "equipment_id");

            migrationBuilder.CreateIndex(
                name: "ix_equipment_deliveries_patient_id",
                table: "equipment_deliveries",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_esas_assessments_encounter_id",
                table: "esas_assessments",
                column: "encounter_id");

            migrationBuilder.CreateIndex(
                name: "ix_esas_assessments_patient_id",
                table: "esas_assessments",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_intervention_logs_case_id",
                table: "intervention_logs",
                column: "case_id");

            migrationBuilder.CreateIndex(
                name: "ix_navigation_tasks_assigned_to_id",
                table: "navigation_tasks",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_navigation_tasks_case_id",
                table: "navigation_tasks",
                column: "case_id");

            migrationBuilder.CreateIndex(
                name: "ix_outreach_activities_outreach_id",
                table: "outreach_activities",
                column: "outreach_id");

            migrationBuilder.CreateIndex(
                name: "ix_outreach_activities_practitioner_id",
                table: "outreach_activities",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_contacts_patient_id",
                table: "patient_contacts",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_emails_patient_id",
                table: "patient_emails",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_outreaches_assigned_practitioner_id",
                table: "patient_outreaches",
                column: "assigned_practitioner_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_outreaches_enrolled_patient_id",
                table: "patient_outreaches",
                column: "enrolled_patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_outreaches_health_plan_id",
                table: "patient_outreaches",
                column: "health_plan_id");

            migrationBuilder.CreateIndex(
                name: "ix_patient_phones_patient_id",
                table: "patient_phones",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_patients_facility_id",
                table: "patients",
                column: "facility_id");

            migrationBuilder.CreateIndex(
                name: "ix_patients_health_plan_id",
                table: "patients",
                column: "health_plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_patients_mrn",
                table: "patients",
                column: "mrn",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_patients_philhealth_number",
                table: "patients",
                column: "philhealth_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_practitioner_licensures_practitioner_id",
                table: "practitioner_licensures",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "ix_practitioner_service_areas_practitioner_id",
                table: "practitioner_service_areas",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "IX_practitioner_service_areas_zip_code",
                table: "practitioner_service_areas",
                column: "zip_code");

            migrationBuilder.CreateIndex(
                name: "ix_practitioners_appointment_id",
                table: "practitioners",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "IX_practitioners_npi_number",
                table: "practitioners",
                column: "npi_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_practitioners_prc_license_number",
                table: "practitioners",
                column: "prc_license_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_practitioners_user_id",
                table: "practitioners",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_prescriptions_medication_id",
                table: "prescriptions",
                column: "medication_id");

            migrationBuilder.CreateIndex(
                name: "ix_prescriptions_patient_id",
                table: "prescriptions",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "ix_prescriptions_prescribed_by_id",
                table: "prescriptions",
                column: "prescribed_by_id");

            migrationBuilder.CreateIndex(
                name: "ix_provider_shifts_practitioner_id",
                table: "provider_shifts",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "ix_schedule_blocks_practitioner_id",
                table: "schedule_blocks",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "ix_sdoh_assessments_assessor_id",
                table: "sdoh_assessments",
                column: "assessor_id");

            migrationBuilder.CreateIndex(
                name: "IX_sdoh_assessments_case_id",
                table: "sdoh_assessments",
                column: "case_id");

            migrationBuilder.CreateIndex(
                name: "IX_telemetry_logs_equipment_id_recorded_at",
                table: "telemetry_logs",
                columns: new[] { "equipment_id", "recorded_at" });

            migrationBuilder.CreateIndex(
                name: "IX_vital_signs_encounter_id",
                table: "vital_signs",
                column: "encounter_id");

            migrationBuilder.CreateIndex(
                name: "ix_z_benefit_claims_patient_id",
                table: "z_benefit_claims",
                column: "patient_id");

            migrationBuilder.AddForeignKey(
                name: "fk_appointment_resources__schedule_blocks_schedule_block_temp_id",
                table: "appointment_resources",
                column: "block_id",
                principalTable: "schedule_blocks",
                principalColumn: "block_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointment_resources_appointments_appointment_id",
                table: "appointment_resources",
                column: "appointment_id",
                principalTable: "appointments",
                principalColumn: "appointment_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_appointments__practitioners_practitioner_id",
                table: "appointments",
                column: "practitioner_id",
                principalTable: "practitioners",
                principalColumn: "practitioner_id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_patients_facilities_facility_id",
                table: "patients");

            migrationBuilder.DropForeignKey(
                name: "fk_appointments__patients_patient_id",
                table: "appointments");

            migrationBuilder.DropForeignKey(
                name: "fk_practitioners_appointments_appointment_id",
                table: "practitioners");

            migrationBuilder.DropTable(
                name: "address");

            migrationBuilder.DropTable(
                name: "advance_directives");

            migrationBuilder.DropTable(
                name: "allergies");

            migrationBuilder.DropTable(
                name: "appointment_resources");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "barrier_logs");

            migrationBuilder.DropTable(
                name: "billing_invoices");

            migrationBuilder.DropTable(
                name: "claim_status_logs");

            migrationBuilder.DropTable(
                name: "clinical_notes");

            migrationBuilder.DropTable(
                name: "diagnoses");

            migrationBuilder.DropTable(
                name: "equipment_deliveries");

            migrationBuilder.DropTable(
                name: "esas_assessments");

            migrationBuilder.DropTable(
                name: "integration_profiles");

            migrationBuilder.DropTable(
                name: "intervention_logs");

            migrationBuilder.DropTable(
                name: "navigation_tasks");

            migrationBuilder.DropTable(
                name: "outreach_activities");

            migrationBuilder.DropTable(
                name: "outreach_scripts");

            migrationBuilder.DropTable(
                name: "patient_contacts");

            migrationBuilder.DropTable(
                name: "patient_emails");

            migrationBuilder.DropTable(
                name: "patient_phones");

            migrationBuilder.DropTable(
                name: "practitioner_licensures");

            migrationBuilder.DropTable(
                name: "practitioner_service_areas");

            migrationBuilder.DropTable(
                name: "prescriptions");

            migrationBuilder.DropTable(
                name: "provider_shifts");

            migrationBuilder.DropTable(
                name: "sdoh_assessments");

            migrationBuilder.DropTable(
                name: "telemetry_logs");

            migrationBuilder.DropTable(
                name: "vital_signs");

            migrationBuilder.DropTable(
                name: "schedule_blocks");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "z_benefit_claims");

            migrationBuilder.DropTable(
                name: "patient_outreaches");

            migrationBuilder.DropTable(
                name: "medications");

            migrationBuilder.DropTable(
                name: "care_navigation_cases");

            migrationBuilder.DropTable(
                name: "durable_medical_equipment");

            migrationBuilder.DropTable(
                name: "clinical_encounters");

            migrationBuilder.DropTable(
                name: "facilities");

            migrationBuilder.DropTable(
                name: "patients");

            migrationBuilder.DropTable(
                name: "health_plans");

            migrationBuilder.DropTable(
                name: "appointments");

            migrationBuilder.DropTable(
                name: "practitioners");
        }
    }
}
