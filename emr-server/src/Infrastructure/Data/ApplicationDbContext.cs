using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

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
    public DbSet<CareNavigationCase> CareNavigationCases { get; set; } = null!;
    public DbSet<SdohAssessment> SdohAssessments { get; set; } = null!;
    public DbSet<NavigationTask> NavigationTasks { get; set; } = null!;
    public DbSet<BarrierLog> BarrierLogs { get; set; } = null!;
    public DbSet<InterventionLog> InterventionLogs { get; set; } = null!;
    public DbSet<ZBenefitClaim> ZBenefitClaims { get; set; } = null!;
    public DbSet<ClaimStatusLog> ClaimStatusLogs { get; set; } = null!;
    public DbSet<BillingInvoice> BillingInvoices { get; set; } = null!;
    public DbSet<ClinicalEncounter> ClinicalEncounters { get; set; } = null!;
    public DbSet<Diagnosis> Diagnoses { get; set; } = null!;
    public DbSet<Allergy> Allergies { get; set; } = null!;
    public DbSet<VitalSign> VitalSigns { get; set; } = null!;
    public DbSet<EsasAssessment> EsasAssessments { get; set; } = null!;
    public DbSet<ClinicalNote> ClinicalNotes { get; set; } = null!;
    public DbSet<DurableMedicalEquipment> DurableMedicalEquipment { get; set; } = null!;
    public DbSet<EquipmentDelivery> EquipmentDeliveries { get; set; } = null!;
    public DbSet<TelemetryLog> TelemetryLogs { get; set; } = null!;
    public DbSet<PractitionerLicensure> PractitionerLicensures { get; set; } = null!;
    public DbSet<PractitionerServiceArea> PractitionerServiceAreas { get; set; } = null!;
    public DbSet<PatientContact> PatientContacts { get; set; } = null!;
    public DbSet<PatientPhone> PatientPhones => Set<PatientPhone>();
    public DbSet<PatientEmail> PatientEmails => Set<PatientEmail>();
    public DbSet<PatientOutreach> PatientOutreaches => Set<PatientOutreach>();
    public DbSet<HealthPlan> HealthPlans => Set<HealthPlan>();
    public DbSet<ProviderShift> ProviderShifts => Set<ProviderShift>();
    public DbSet<OutreachScript> OutreachScripts => Set<OutreachScript>();
    public DbSet<OutreachActivity> OutreachActivities => Set<OutreachActivity>();
    public DbSet<OutreachContact> OutreachContacts => Set<OutreachContact>();

    public DbSet<Facility> Facilities => Set<Facility>();
    public DbSet<AdvanceDirective> AdvanceDirectives => Set<AdvanceDirective>();
    public DbSet<IntegrationProfile> IntegrationProfiles => Set<IntegrationProfile>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<EntityAddress> EntityAddresses => Set<EntityAddress>();



    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
                    // entry.Entity.CreatedBy = _currentUserService.UserId; // If we had a user service
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
                    // entry.Entity.UpdatedBy = _currentUserService.UserId;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Define sequence for MRN generation
        modelBuilder.HasSequence<long>("patient_mrn_seq")
            .StartsAt(10000)
            .IncrementsBy(1);
        // Global naming convention: snake_case for all tables and columns
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            // Table names (exclude identity tables which have their own naming)
            var tableName = entity.GetTableName();
            if (tableName != null && tableName.StartsWith("AspNet"))
            {
                continue;
            }

            entity.SetTableName(tableName?.ToSnakeCase());

            foreach (var property in entity.GetProperties())
            {
                // Column names
                property.SetColumnName(property.GetColumnName().ToSnakeCase());
            }

            foreach (var key in entity.GetKeys())
            {
                key.SetName(key.GetName()?.ToSnakeCase());
            }

            foreach (var key in entity.GetForeignKeys())
            {
                key.SetConstraintName(key.GetConstraintName()?.ToSnakeCase());
            }

            foreach (var index in entity.GetIndexes())
            {
                index.SetDatabaseName(index.GetDatabaseName()?.ToSnakeCase());
            }
        }

        // Configuration mapped via separate Configuration files.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Explicitly map Practitioner -> ProviderShift relationship to avoid shadow properties
        modelBuilder.Entity<ProviderShift>(entity =>
        {
            entity.HasOne(d => d.Practitioner)
                .WithMany(p => p.Shifts)
                .HasForeignKey(d => d.PractitionerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

public static class StringExtensions
{
    public static string ToSnakeCase(this string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        var startUnderscore = input.StartsWith("_");
        if (startUnderscore) input = input.Substring(1);
        
        var result = System.Text.RegularExpressions.Regex.Replace(input, "(?<!^)([A-Z][a-z]|(?<=[a-z])[A-Z])", "_$1").ToLower();
        return startUnderscore ? "_" + result : result;
    }
}
