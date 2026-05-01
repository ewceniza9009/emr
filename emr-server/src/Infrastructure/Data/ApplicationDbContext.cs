using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        // Suppress the warning about pending model changes to avoid crash on MigrateAsync in dev
        optionsBuilder.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }

    public DbSet<Patient> Patients { get; set; } = null!;
    public DbSet<Practitioner> Practitioners { get; set; } = null!;
    public DbSet<Appointment> Appointments { get; set; } = null!;
    public DbSet<ScheduleBlock> ScheduleBlocks { get; set; } = null!;
    public DbSet<AppointmentResource> AppointmentResources { get; set; } = null!;
    public DbSet<CareNavigationCase> CareNavigationCases { get; } = null!;
    public DbSet<SdohAssessment> SdohAssessments { get; } = null!;
    public DbSet<NavigationTask> NavigationTasks { get; } = null!;
    public DbSet<BarrierLog> BarrierLogs { get; } = null!;
    public DbSet<InterventionLog> InterventionLogs { get; } = null!;
    public DbSet<ZBenefitClaim> ZBenefitClaims { get; } = null!;
    public DbSet<ClaimStatusLog> ClaimStatusLogs { get; } = null!;
    public DbSet<BillingInvoice> BillingInvoices { get; } = null!;
    public DbSet<ClinicalEncounter> ClinicalEncounters { get; } = null!;
    public DbSet<Diagnosis> Diagnoses { get; } = null!;
    public DbSet<Allergy> Allergies { get; } = null!;
    public DbSet<VitalSign> VitalSigns { get; } = null!;
    public DbSet<EsasAssessment> EsasAssessments { get; } = null!;
    public DbSet<ClinicalNote> ClinicalNotes { get; } = null!;
    public DbSet<DurableMedicalEquipment> DurableMedicalEquipment { get; } = null!;
    public DbSet<EquipmentDelivery> EquipmentDeliveries { get; } = null!;
    public DbSet<TelemetryLog> TelemetryLogs { get; } = null!;
    public DbSet<PractitionerLicensure> PractitionerLicensures { get; } = null!;
    public DbSet<PractitionerServiceArea> PractitionerServiceAreas { get; } = null!;
    public DbSet<PatientContact> PatientContacts { get; } = null!;
    public DbSet<PatientPhone> PatientPhones => Set<PatientPhone>();
    public DbSet<PatientEmail> PatientEmails => Set<PatientEmail>();
    public DbSet<PatientOutreach> PatientOutreaches => Set<PatientOutreach>();
    public DbSet<HealthPlan> HealthPlans => Set<HealthPlan>();
    public DbSet<ProviderShift> ProviderShifts => Set<ProviderShift>();
    public DbSet<OutreachScript> OutreachScripts => Set<OutreachScript>();
    public DbSet<OutreachActivity> OutreachActivities => Set<OutreachActivity>();
    public DbSet<Facility> Facilities => Set<Facility>();
    public DbSet<AdvanceDirective> AdvanceDirectives => Set<AdvanceDirective>();
    public DbSet<IntegrationProfile> IntegrationProfiles => Set<IntegrationProfile>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configuration mapped via separate Configuration files.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
