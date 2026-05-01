using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
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
                    last_maintenance_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_durable_medical_equipment", x => x.equipment_id);
                });

            migrationBuilder.CreateTable(
                name: "patients",
                columns: table => new
                {
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    mrn = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    dob = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    biological_sex = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    gender_identity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    philhealth_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    address = table.Column<string>(type: "text", nullable: false),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patients", x => x.patient_id);
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
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_practitioners", x => x.practitioner_id);
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
                    recorded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_telemetry_logs", x => x.log_id);
                    table.ForeignKey(
                        name: "FK_telemetry_logs_durable_medical_equipment_equipment_id",
                        column: x => x.equipment_id,
                        principalTable: "durable_medical_equipment",
                        principalColumn: "equipment_id",
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
                    identified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_allergies", x => x.allergy_id);
                    table.ForeignKey(
                        name: "FK_allergies_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "appointments",
                columns: table => new
                {
                    appointment_id = table.Column<Guid>(type: "uuid", nullable: false),
                    patient_id = table.Column<Guid>(type: "uuid", nullable: false),
                    visit_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    scheduled_start = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    scheduled_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    modality = table.Column<string>(type: "text", nullable: false),
                    meeting_link = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_appointments", x => x.appointment_id);
                    table.ForeignKey(
                        name: "FK_appointments_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
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
                    has_power_of_attorney = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_patient_contacts", x => x.contact_id);
                    table.ForeignKey(
                        name: "FK_patient_contacts_patients_patient_id",
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
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_z_benefit_claims", x => x.claim_id);
                    table.ForeignKey(
                        name: "FK_z_benefit_claims_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
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
                    opened_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_care_navigation_cases", x => x.case_id);
                    table.ForeignKey(
                        name: "FK_care_navigation_cases_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_care_navigation_cases_practitioners_navigator_id",
                        column: x => x.navigator_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
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
                        name: "FK_practitioner_licensures_practitioners_practitioner_id",
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
                        name: "FK_practitioner_service_areas_practitioners_practitioner_id",
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
                        name: "FK_schedule_blocks_practitioners_practitioner_id",
                        column: x => x.practitioner_id,
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
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    admitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    discharged_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clinical_encounters", x => x.encounter_id);
                    table.ForeignKey(
                        name: "FK_clinical_encounters_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "appointment_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_clinical_encounters_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_clinical_encounters_practitioners_practitioner_id",
                        column: x => x.practitioner_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
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
                    due_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_billing_invoices", x => x.invoice_id);
                    table.ForeignKey(
                        name: "FK_billing_invoices_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_billing_invoices_z_benefit_claims_claim_id",
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
                    changed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_claim_status_logs", x => x.log_id);
                    table.ForeignKey(
                        name: "FK_claim_status_logs_z_benefit_claims_claim_id",
                        column: x => x.claim_id,
                        principalTable: "z_benefit_claims",
                        principalColumn: "claim_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "barrier_logs",
                columns: table => new
                {
                    barrier_id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    barrier_category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_barrier_logs", x => x.barrier_id);
                    table.ForeignKey(
                        name: "FK_barrier_logs_care_navigation_cases_case_id",
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
                    logged_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_intervention_logs", x => x.intervention_id);
                    table.ForeignKey(
                        name: "FK_intervention_logs_care_navigation_cases_case_id",
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
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_navigation_tasks", x => x.task_id);
                    table.ForeignKey(
                        name: "FK_navigation_tasks_care_navigation_cases_case_id",
                        column: x => x.case_id,
                        principalTable: "care_navigation_cases",
                        principalColumn: "case_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_navigation_tasks_practitioners_assigned_to",
                        column: x => x.assigned_to,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
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
                    assessed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sdoh_assessments", x => x.sdoh_id);
                    table.ForeignKey(
                        name: "FK_sdoh_assessments_care_navigation_cases_case_id",
                        column: x => x.case_id,
                        principalTable: "care_navigation_cases",
                        principalColumn: "case_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_sdoh_assessments_practitioners_assessor_id",
                        column: x => x.assessor_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
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
                    table.ForeignKey(
                        name: "FK_appointment_resources_appointments_appointment_id",
                        column: x => x.appointment_id,
                        principalTable: "appointments",
                        principalColumn: "appointment_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_appointment_resources_schedule_blocks_block_id",
                        column: x => x.block_id,
                        principalTable: "schedule_blocks",
                        principalColumn: "block_id",
                        onDelete: ReferentialAction.Cascade);
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
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_signed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_clinical_notes", x => x.note_id);
                    table.ForeignKey(
                        name: "FK_clinical_notes_clinical_encounters_encounter_id",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_clinical_notes_practitioners_author_id",
                        column: x => x.author_id,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Restrict);
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
                    diagnosed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_diagnoses", x => x.diagnosis_id);
                    table.ForeignKey(
                        name: "FK_diagnoses_clinical_encounters_encounter_id",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_diagnoses_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
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
                    delivery_address = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipment_deliveries", x => x.delivery_id);
                    table.ForeignKey(
                        name: "FK_equipment_deliveries_clinical_encounters_encounter_id",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_equipment_deliveries_durable_medical_equipment_equipment_id",
                        column: x => x.equipment_id,
                        principalTable: "durable_medical_equipment",
                        principalColumn: "equipment_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_equipment_deliveries_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
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
                    assessed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_esas_assessments", x => x.assessment_id);
                    table.ForeignKey(
                        name: "FK_esas_assessments_clinical_encounters_encounter_id",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_esas_assessments_patients_patient_id",
                        column: x => x.patient_id,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
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
                    recorded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_vital_signs", x => x.vital_id);
                    table.ForeignKey(
                        name: "FK_vital_signs_clinical_encounters_encounter_id",
                        column: x => x.encounter_id,
                        principalTable: "clinical_encounters",
                        principalColumn: "encounter_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_allergies_patient_id",
                table: "allergies",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_appointment_resources_block_id",
                table: "appointment_resources",
                column: "block_id");

            migrationBuilder.CreateIndex(
                name: "IX_appointments_patient_id",
                table: "appointments",
                column: "patient_id");

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
                name: "IX_billing_invoices_patient_id",
                table: "billing_invoices",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_care_navigation_cases_navigator_id",
                table: "care_navigation_cases",
                column: "navigator_id");

            migrationBuilder.CreateIndex(
                name: "IX_care_navigation_cases_patient_id",
                table: "care_navigation_cases",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_claim_status_logs_claim_id",
                table: "claim_status_logs",
                column: "claim_id");

            migrationBuilder.CreateIndex(
                name: "IX_clinical_encounters_appointment_id",
                table: "clinical_encounters",
                column: "appointment_id");

            migrationBuilder.CreateIndex(
                name: "IX_clinical_encounters_patient_id",
                table: "clinical_encounters",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_clinical_encounters_practitioner_id",
                table: "clinical_encounters",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "IX_clinical_notes_author_id",
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
                name: "IX_diagnoses_patient_id",
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
                name: "IX_equipment_deliveries_patient_id",
                table: "equipment_deliveries",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_esas_assessments_encounter_id",
                table: "esas_assessments",
                column: "encounter_id");

            migrationBuilder.CreateIndex(
                name: "IX_esas_assessments_patient_id",
                table: "esas_assessments",
                column: "patient_id");

            migrationBuilder.CreateIndex(
                name: "IX_intervention_logs_case_id",
                table: "intervention_logs",
                column: "case_id");

            migrationBuilder.CreateIndex(
                name: "IX_navigation_tasks_assigned_to",
                table: "navigation_tasks",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_navigation_tasks_case_id",
                table: "navigation_tasks",
                column: "case_id");

            migrationBuilder.CreateIndex(
                name: "IX_patient_contacts_patient_id",
                table: "patient_contacts",
                column: "patient_id");

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
                name: "IX_practitioner_licensures_practitioner_id",
                table: "practitioner_licensures",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "IX_practitioner_service_areas_practitioner_id",
                table: "practitioner_service_areas",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "IX_practitioner_service_areas_zip_code",
                table: "practitioner_service_areas",
                column: "zip_code");

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
                name: "IX_schedule_blocks_practitioner_id",
                table: "schedule_blocks",
                column: "practitioner_id");

            migrationBuilder.CreateIndex(
                name: "IX_sdoh_assessments_assessor_id",
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
                name: "IX_z_benefit_claims_patient_id",
                table: "z_benefit_claims",
                column: "patient_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
                name: "intervention_logs");

            migrationBuilder.DropTable(
                name: "navigation_tasks");

            migrationBuilder.DropTable(
                name: "patient_contacts");

            migrationBuilder.DropTable(
                name: "practitioner_licensures");

            migrationBuilder.DropTable(
                name: "practitioner_service_areas");

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
                name: "care_navigation_cases");

            migrationBuilder.DropTable(
                name: "durable_medical_equipment");

            migrationBuilder.DropTable(
                name: "clinical_encounters");

            migrationBuilder.DropTable(
                name: "appointments");

            migrationBuilder.DropTable(
                name: "practitioners");

            migrationBuilder.DropTable(
                name: "patients");
        }
    }
}
