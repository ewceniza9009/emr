namespace Domain.Entities;

public enum IntegrationPartner
{
    ElationHealth,
    CareSource,
    Surescripts,
    HealthGorilla
}

public class IntegrationProfile
{
    public Guid IntegrationProfileId { get; set; } = Guid.NewGuid();
    public IntegrationPartner Partner { get; set; }
    public string ApiKey { get; set; } = string.Empty;
    public string? BaseUrl { get; set; }
    public string? WebhookSecret { get; set; }
    public DateTimeOffset? LastSyncAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? SettingsJson { get; set; } // For partner-specific configs
}
