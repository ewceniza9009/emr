using Domain.Common;

namespace Domain.Entities;

public class TenantConfiguration : BaseEntity, ITenantEntity
{
    public Guid TenantConfigurationId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; } = Guid.NewGuid();
    public string OrganizationName { get; set; } = "Halkyone Clinical Center";

    // Regional Settings
    public string Currency { get; set; } = "PHP";

    private string _timezone = TimeZoneInfo.Local.Id;
    public string Timezone
    {
        get => _timezone;
        set
        {
            _timezone = value;
            UpdateCurrencyFromTimezone();
        }
    }

    public void UpdateCurrencyFromTimezone()
    {
        Currency = _timezone switch
        {
            "Asia/Manila" or "Singapore Standard Time" => "PHP",
            "America/New_York" or "Eastern Standard Time" or "US Eastern Standard Time" => "USD",
            "America/Chicago" or "Central Standard Time" => "USD",
            "America/Denver" or "Mountain Standard Time" => "USD",
            "America/Los_Angeles" or "Pacific Standard Time" => "USD",
            "Europe/London" or "GMT Standard Time" => "GBP",
            "Europe/Paris" or "Central European Standard Time" => "EUR",
            "Australia/Sydney" or "AUS Eastern Standard Time" => "AUD",
            "Asia/Singapore" => "SGD",
            "Asia/Hong_Kong" => "HKD",
            _ => Currency // Fallback to existing if unknown
        };
    }
    public string Language { get; set; } = "en";
    public string DateFormat { get; set; } = "MM/DD/YYYY";

    public int AmStartHour { get; set; } = 8;
    public int PmStartHour { get; set; } = 13;
    public int DayEndHour { get; set; } = 18;

    // Engine & Logistics
    public int EngineSafetyDriveMins { get; set; } = 5;
    public double EngineSafetyDistKm { get; set; } = 5.0;

    // Telemetry & Triage
    public int IotSyncIntervalMs { get; set; } = 5000;
    public int UrgentPainThreshold { get; set; } = 7;
    public int UrgentWellbeingThreshold { get; set; } = 7;

    // Operational Flags
    public bool IsActive { get; set; } = true;
    public bool EnableElasticsearch { get; set; } = false;

    // Security & Compliance
    public bool EnforceMfa { get; set; } = false;
    public int SessionTimeoutMinutes { get; set; } = 30;
    public bool StrictOnboarding { get; set; } = true;

    // Contact Info
    public string? ContactEmail { get; set; }

    // Extended Settings (Serialized JSON for future-proofing)
    public string? ExtendedSettingsJson { get; set; }
}
