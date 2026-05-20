using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

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

    public virtual DbSet<Patient> Patients { get; set; } = null!;
    public virtual DbSet<Practitioner> Practitioners { get; set; } = null!;
    public virtual DbSet<PractitionerLicensure> PractitionerLicensures { get; set; } = null!;
    public virtual DbSet<PractitionerServiceArea> PractitionerServiceAreas { get; set; } = null!;
    public virtual DbSet<PatientContact> PatientContacts { get; set; } = null!;
    public virtual DbSet<PatientPhone> PatientPhones => Set<PatientPhone>();
    public virtual DbSet<PatientEmail> PatientEmails => Set<PatientEmail>();
    public virtual DbSet<PatientAccount> PatientAccounts { get; set; } = null!;
    public virtual DbSet<CaregiverLink> CaregiverLinks { get; set; } = null!;
    public virtual DbSet<Appointment> Appointments { get; set; } = null!;
    public virtual DbSet<ScheduleBlock> ScheduleBlocks { get; set; } = null!;
    public virtual DbSet<AppointmentResource> AppointmentResources { get; set; } = null!;
    public virtual DbSet<CareNavigationCase> CareNavigationCases { get; set; } = null!;
    public virtual DbSet<SdohAssessment> SdohAssessments { get; set; } = null!;
    public virtual DbSet<NavigationTask> NavigationTasks { get; set; } = null!;
    public virtual DbSet<BarrierLog> BarrierLogs { get; set; } = null!;
    public virtual DbSet<InterventionLog> InterventionLogs { get; set; } = null!;
    public virtual DbSet<ZBenefitClaim> ZBenefitClaims { get; set; } = null!;
    public virtual DbSet<ClaimStatusLog> ClaimStatusLogs { get; set; } = null!;
    public virtual DbSet<BillingInvoice> BillingInvoices { get; set; } = null!;
    public virtual DbSet<CareThread> CareThreads { get; set; } = null!;
    public virtual DbSet<ChatMessage> ChatMessages { get; set; } = null!;
    public virtual DbSet<BillingInvoiceItem> BillingInvoiceItems { get; set; } = null!;
    public virtual DbSet<ClinicalEncounter> ClinicalEncounters { get; set; } = null!;
    public virtual DbSet<Diagnosis> Diagnoses { get; set; } = null!;
    public virtual DbSet<Allergy> Allergies { get; set; } = null!;
    public virtual DbSet<VitalSign> VitalSigns { get; set; } = null!;
    public virtual DbSet<EsasAssessment> EsasAssessments { get; set; } = null!;
    public virtual DbSet<ClinicalNote> ClinicalNotes { get; set; } = null!;
    public virtual DbSet<DurableMedicalEquipment> DurableMedicalEquipment { get; set; } = null!;
    public virtual DbSet<EquipmentDelivery> EquipmentDeliveries { get; set; } = null!;
    public virtual DbSet<TelemetryLog> TelemetryLogs { get; set; } = null!;
    public virtual DbSet<Prescription> Prescriptions => Set<Prescription>();
    public virtual DbSet<SpiritualAssessment> SpiritualAssessments => Set<SpiritualAssessment>();
    public virtual DbSet<PatientDocument> PatientDocuments => Set<PatientDocument>();
    public virtual DbSet<EntityAddress> EntityAddresses => Set<EntityAddress>();
    public virtual DbSet<SmartPhrase> SmartPhrases => Set<SmartPhrase>();
    public virtual DbSet<Questionnaire> Questionnaires => Set<Questionnaire>();
    public virtual DbSet<Question> Questions => Set<Question>();
    public virtual DbSet<PatientOutreach> PatientOutreaches => Set<PatientOutreach>();
    public virtual DbSet<HealthPlan> HealthPlans => Set<HealthPlan>();
    public virtual DbSet<ProviderShift> ProviderShifts => Set<ProviderShift>();
    public virtual DbSet<OutreachScript> OutreachScripts => Set<OutreachScript>();
    public virtual DbSet<OutreachActivity> OutreachActivities => Set<OutreachActivity>();
    public virtual DbSet<OutreachContact> OutreachContacts => Set<OutreachContact>();
    public virtual DbSet<SecurityAuditLog> SecurityAuditLogs => Set<SecurityAuditLog>();
    public virtual DbSet<Facility> Facilities => Set<Facility>();
    public virtual DbSet<AdvanceDirective> AdvanceDirectives => Set<AdvanceDirective>();
    public virtual DbSet<IntegrationProfile> IntegrationProfiles => Set<IntegrationProfile>();
    public virtual DbSet<Medication> Medications => Set<Medication>();
    public virtual DbSet<AssessmentResponse> AssessmentResponses => Set<AssessmentResponse>();
    public virtual DbSet<TenantConfiguration> TenantConfigurations => Set<TenantConfiguration>();

    public virtual DbSet<OutboxMessage> OutboxMessages { get; set; } = null!;
    public virtual DbSet<Notification> Notifications { get; set; } = null!;
    public virtual DbSet<MagicToken> MagicTokens { get; set; } = null!;

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

    public Task<Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction> BeginTransactionAsync(
        CancellationToken cancellationToken = default
    ) => Database.BeginTransactionAsync(cancellationToken);

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

        // --- GLOBAL TEMPORAL HARDENING: Npgsql/PostgreSQL UTC Enforcement ---
        var dateTimeOffsetConverter = new ValueConverter<DateTimeOffset, DateTimeOffset>(
            v => v.ToUniversalTime(),
            v => v.ToUniversalTime()
        );

        var nullableDateTimeOffsetConverter = new ValueConverter<DateTimeOffset?, DateTimeOffset?>(
            v => v.HasValue ? v.Value.ToUniversalTime() : v,
            v => v.HasValue ? v.Value.ToUniversalTime() : v
        );

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTimeOffset))
                {
                    property.SetValueConverter(dateTimeOffsetConverter);
                }
                else if (property.ClrType == typeof(DateTimeOffset?))
                {
                    property.SetValueConverter(nullableDateTimeOffsetConverter);
                }
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
