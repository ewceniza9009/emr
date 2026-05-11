using System.Text.RegularExpressions;
using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;
    private readonly ISearchService _searchService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService,
        ISearchService searchService
    )
        : base(options)
    {
        _currentUserService = currentUserService;
        _searchService = searchService;
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder.ConfigureWarnings(w =>
            w.Ignore(
                Microsoft
                    .EntityFrameworkCore
                    .Diagnostics
                    .RelationalEventId
                    .PendingModelChangesWarning
            )
        );
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
    public DbSet<BillingInvoiceItem> BillingInvoiceItems { get; set; } = null!;
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
    public DbSet<SecurityAuditLog> SecurityAuditLogs => Set<SecurityAuditLog>();

    public DbSet<Facility> Facilities => Set<Facility>();
    public DbSet<AdvanceDirective> AdvanceDirectives => Set<AdvanceDirective>();
    public DbSet<IntegrationProfile> IntegrationProfiles => Set<IntegrationProfile>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<SpiritualAssessment> SpiritualAssessments => Set<SpiritualAssessment>();
    public DbSet<PatientDocument> PatientDocuments => Set<PatientDocument>();
    public DbSet<EntityAddress> EntityAddresses => Set<EntityAddress>();
    public DbSet<SmartPhrase> SmartPhrases => Set<SmartPhrase>();
    public DbSet<Questionnaire> Questionnaires => Set<Questionnaire>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<AssessmentResponse> AssessmentResponses => Set<AssessmentResponse>();
    public DbSet<TenantConfiguration> TenantConfigurations => Set<TenantConfiguration>();

    public DbSet<OutboxMessage> OutboxMessages { get; set; } = null!;

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var domainEvents = ChangeTracker
            .Entries<BaseEntity>()
            .Select(x => x.Entity)
            .Where(x => x.DomainEvents.Any())
            .SelectMany(x =>
            {
                var events = x.DomainEvents.ToList();
                x.ClearDomainEvents();
                return events;
            })
            .ToList();

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTimeOffset.UtcNow;
                    if (
                        entry.Entity is ITenantEntity tenantEntity
                        && tenantEntity.TenantId == Guid.Empty
                    )
                    {
                        tenantEntity.TenantId = _currentUserService.TenantId ?? Guid.Empty;
                    }
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTimeOffset.UtcNow;
                    break;
            }
        }

        // Automatic Indexing Events for Patients and Outreach
        var patientsToIndex = ChangeTracker
            .Entries<Patient>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified)
            .Select(e => e.Entity)
            .ToList();

        var outreachToIndex = ChangeTracker
            .Entries<PatientOutreach>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified)
            .Select(e => e.Entity)
            .ToList();

        // Map to Outbox Messages
        var outboxMessages = domainEvents
            .Select(domainEvent => new OutboxMessage
            {
                Id = Guid.NewGuid(),
                Type = domainEvent.GetType().Name,
                Content = System.Text.Json.JsonSerializer.Serialize(
                    domainEvent,
                    domainEvent.GetType()
                ),
                CreatedOnUtc = DateTimeOffset.UtcNow,
            })
            .ToList();

        // Add indexing specific outbox messages if not already covered by domain events
        // For simplicity in this EMR, we'll just use a dedicated "Indexing" outbox type
        foreach (var p in patientsToIndex)
        {
            outboxMessages.Add(
                new OutboxMessage
                {
                    Type = "IndexPatient",
                    Content = p.PatientId.ToString(),
                    CreatedOnUtc = DateTimeOffset.UtcNow,
                }
            );
        }

        foreach (var o in outreachToIndex)
        {
            outboxMessages.Add(
                new OutboxMessage
                {
                    Type = "IndexOutreach",
                    Content = o.PatientOutreachId.ToString(),
                    CreatedOnUtc = DateTimeOffset.UtcNow,
                }
            );
        }

        if (outboxMessages.Any())
        {
            OutboxMessages.AddRange(outboxMessages);
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    public Guid CurrentTenantId => _currentUserService.TenantId ?? Guid.Empty;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply manual configurations first so the global naming loop can see and transform them
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Ignore domain events
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entity.ClrType))
            {
                modelBuilder.Entity(entity.ClrType).Ignore(nameof(BaseEntity.DomainEvents));
            }
        }

        modelBuilder.HasSequence<long>("patient_mrn_seq").StartsAt(10000).IncrementsBy(1);
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entity.GetTableName();
            if (tableName != null && tableName.StartsWith("AspNet"))
            {
                continue;
            }

            // Only apply SetTableName to non-owned types to prevent them from being split into separate tables
            if (!entity.IsOwned())
            {
                entity.SetTableName(tableName?.ToSnakeCase());
            }

            foreach (var property in entity.GetProperties())
            {
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

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(
                        nameof(ApplyTenantFilter),
                        System.Reflection.BindingFlags.NonPublic
                            | System.Reflection.BindingFlags.Instance
                    )
                    ?.MakeGenericMethod(entityType.ClrType);

                method?.Invoke(this, new object[] { modelBuilder });
            }
        }
    }

    private void ApplyTenantFilter<T>(ModelBuilder modelBuilder)
        where T : class, ITenantEntity
    {
        modelBuilder.Entity<T>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
    }
}

public static class StringExtensions
{
    public static string ToSnakeCase(this string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;
        var startUnderscore = input.StartsWith("_");
        if (startUnderscore)
            input = input.Substring(1);

        var result = System
            .Text.RegularExpressions.Regex.Replace(
                input,
                "(?<!^)([A-Z][a-z]|(?<=[a-z])[A-Z])",
                "_$1"
            )
            .ToLower();
        return startUnderscore ? "_" + result : result;
    }
}
