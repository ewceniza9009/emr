using Domain.Common;

namespace Domain.Entities;

public class TenantConfiguration : BaseEntity, ITenantEntity
{
    public Guid TenantConfigurationId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; } = Guid.NewGuid();
    public string OrganizationName { get; set; } = "Halkyone Clinical";

    // Regional Settings
    public string Currency { get; set; } = "PHP";
    public string Timezone { get; set; } = "Asia/Manila";
    public string Language { get; set; } = "en";
    public string DateFormat { get; set; } = "MM/DD/YYYY";

    public int AmStartHour { get; set; } = 8;
    public int PmStartHour { get; set; } = 13;
    public int DayEndHour { get; set; } = 18;

    // Engine & Logistics
    public int EngineSafetyDriveMins { get; set; } = 5;
    public double EngineSafetyDistKm { get; set; } = 5.0;

    // Telemetry & Triage
    public bool EnableTelemetry { get; set; } = true;
    public bool EnableSignalR { get; set; } = true;
    public int TelemetryDelaySeconds { get; set; } = 5;
    public int IotSyncIntervalMs { get; set; } = 5000;
    public int UrgentPainThreshold { get; set; } = 7;
    public int UrgentWellbeingThreshold { get; set; } = 7;

    // Operational Flags
    public bool IsActive { get; set; } = true;
    public bool EnableElasticsearch { get; set; } = false;
    public bool EnableOsrmTravel { get; set; } = false;

    // Security & Compliance
    public bool EnforceMfa { get; set; } = false;
    public int SessionTimeoutMinutes { get; set; } = 30;
    public bool StrictOnboarding { get; set; } = true;

    // Contact Info
    public string? ContactEmail { get; set; }

    // Extended Settings (Serialized JSON for future-proofing)
    public string? ExtendedSettingsJson { get; set; }
}
