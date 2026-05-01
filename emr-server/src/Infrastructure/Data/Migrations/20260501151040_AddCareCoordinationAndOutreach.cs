using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCareCoordinationAndOutreach : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BarriersToCare",
                table: "patients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CommunicationStatus",
                table: "patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FacilityId",
                table: "patients",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HealthPlanId",
                table: "patients",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TechAccess",
                table: "patients",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ChiefComplaint",
                table: "clinical_encounters",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EncounterDate",
                table: "clinical_encounters",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<int>(
                name: "PpsScore",
                table: "clinical_encounters",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "clinical_encounters",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "AdvanceDirectives",
                columns: table => new
                {
                    AdvanceDirectiveId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    DocumentUrl = table.Column<string>(type: "text", nullable: true),
                    EffectiveDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdvanceDirectives", x => x.AdvanceDirectiveId);
                    table.ForeignKey(
                        name: "FK_AdvanceDirectives_patients_PatientId",
                        column: x => x.PatientId,
                        principalTable: "patients",
                        principalColumn: "patient_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Facilities",
                columns: table => new
                {
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: true),
                    ContactPerson = table.Column<string>(type: "text", nullable: true),
                    ContactPhone = table.Column<string>(type: "text", nullable: true),
                    ContactEmail = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Facilities", x => x.FacilityId);
                });

            migrationBuilder.CreateTable(
                name: "HealthPlans",
                columns: table => new
                {
                    HealthPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HealthPlans", x => x.HealthPlanId);
                });

            migrationBuilder.CreateTable(
                name: "OutreachScripts",
                columns: table => new
                {
                    OutreachScriptId = table.Column<Guid>(type: "uuid", nullable: false),
                    LocationName = table.Column<string>(type: "text", nullable: false),
                    PostalCode = table.Column<string>(type: "text", nullable: false),
                    ScriptTitle = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutreachScripts", x => x.OutreachScriptId);
                });

            migrationBuilder.CreateTable(
                name: "PatientOutreaches",
                columns: table => new
                {
                    PatientOutreachId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstName = table.Column<string>(type: "text", nullable: false),
                    LastName = table.Column<string>(type: "text", nullable: false),
                    City = table.Column<string>(type: "text", nullable: false),
                    ReferralSource = table.Column<string>(type: "text", nullable: true),
                    PrimaryPhone = table.Column<string>(type: "text", nullable: true),
                    PrimaryEmail = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    NextFollowUpDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsAccepted = table.Column<bool>(type: "boolean", nullable: false),
                    OrientationDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    SelectedModality = table.Column<int>(type: "integer", nullable: true),
                    HealthPlanId = table.Column<Guid>(type: "uuid", nullable: true),
                    CommunicationStatus = table.Column<int>(type: "integer", nullable: true),
                    TechAccess = table.Column<int>(type: "integer", nullable: true),
                    Disposition = table.Column<int>(type: "integer", nullable: false),
                    BarriersToCare = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    LastActivityDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CallAttemptCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AssignedPractitionerId = table.Column<Guid>(type: "uuid", nullable: true),
                    EnrolledPatientId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientOutreaches", x => x.PatientOutreachId);
                    table.ForeignKey(
                        name: "FK_PatientOutreaches_HealthPlans_HealthPlanId",
                        column: x => x.HealthPlanId,
                        principalTable: "HealthPlans",
                        principalColumn: "HealthPlanId");
                    table.ForeignKey(
                        name: "FK_PatientOutreaches_patients_EnrolledPatientId",
                        column: x => x.EnrolledPatientId,
                        principalTable: "patients",
                        principalColumn: "patient_id");
                    table.ForeignKey(
                        name: "FK_PatientOutreaches_practitioners_AssignedPractitionerId",
                        column: x => x.AssignedPractitionerId,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id");
                });

            migrationBuilder.CreateTable(
                name: "OutreachActivities",
                columns: table => new
                {
                    OutreachActivityId = table.Column<Guid>(type: "uuid", nullable: false),
                    OutreachId = table.Column<Guid>(type: "uuid", nullable: false),
                    PractitionerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Method = table.Column<int>(type: "integer", nullable: false),
                    Outcome = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    ActivityDate = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutreachActivities", x => x.OutreachActivityId);
                    table.ForeignKey(
                        name: "FK_OutreachActivities_PatientOutreaches_OutreachId",
                        column: x => x.OutreachId,
                        principalTable: "PatientOutreaches",
                        principalColumn: "PatientOutreachId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OutreachActivities_practitioners_PractitionerId",
                        column: x => x.PractitionerId,
                        principalTable: "practitioners",
                        principalColumn: "practitioner_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_patients_FacilityId",
                table: "patients",
                column: "FacilityId");

            migrationBuilder.CreateIndex(
                name: "IX_patients_HealthPlanId",
                table: "patients",
                column: "HealthPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_AdvanceDirectives_PatientId",
                table: "AdvanceDirectives",
                column: "PatientId");

            migrationBuilder.CreateIndex(
                name: "IX_OutreachActivities_OutreachId",
                table: "OutreachActivities",
                column: "OutreachId");

            migrationBuilder.CreateIndex(
                name: "IX_OutreachActivities_PractitionerId",
                table: "OutreachActivities",
                column: "PractitionerId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientOutreaches_AssignedPractitionerId",
                table: "PatientOutreaches",
                column: "AssignedPractitionerId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientOutreaches_EnrolledPatientId",
                table: "PatientOutreaches",
                column: "EnrolledPatientId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientOutreaches_HealthPlanId",
                table: "PatientOutreaches",
                column: "HealthPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_patients_Facilities_FacilityId",
                table: "patients",
                column: "FacilityId",
                principalTable: "Facilities",
                principalColumn: "FacilityId");

            migrationBuilder.AddForeignKey(
                name: "FK_patients_HealthPlans_HealthPlanId",
                table: "patients",
                column: "HealthPlanId",
                principalTable: "HealthPlans",
                principalColumn: "HealthPlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_patients_Facilities_FacilityId",
                table: "patients");

            migrationBuilder.DropForeignKey(
                name: "FK_patients_HealthPlans_HealthPlanId",
                table: "patients");

            migrationBuilder.DropTable(
                name: "AdvanceDirectives");

            migrationBuilder.DropTable(
                name: "Facilities");

            migrationBuilder.DropTable(
                name: "OutreachActivities");

            migrationBuilder.DropTable(
                name: "OutreachScripts");

            migrationBuilder.DropTable(
                name: "PatientOutreaches");

            migrationBuilder.DropTable(
                name: "HealthPlans");

            migrationBuilder.DropIndex(
                name: "IX_patients_FacilityId",
                table: "patients");

            migrationBuilder.DropIndex(
                name: "IX_patients_HealthPlanId",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "BarriersToCare",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "CommunicationStatus",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "FacilityId",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "HealthPlanId",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "TechAccess",
                table: "patients");

            migrationBuilder.DropColumn(
                name: "ChiefComplaint",
                table: "clinical_encounters");

            migrationBuilder.DropColumn(
                name: "EncounterDate",
                table: "clinical_encounters");

            migrationBuilder.DropColumn(
                name: "PpsScore",
                table: "clinical_encounters");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "clinical_encounters");
        }
    }
}
