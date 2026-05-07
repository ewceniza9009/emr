using Domain.Common;

namespace Domain.Entities;

public class TenantConfiguration : BaseEntity, ITenantEntity
{
    public Guid TenantConfigurationId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; } = Guid.NewGuid();
    public string OrganizationName { get; set; } = "Halcyon Clinical";
    
    // Regional Settings
    public string Currency { get; set; } = "PHP";
    public string Timezone { get; set; } = "Asia/Manila";
    public string Language { get; set; } = "en";
    public string DateFormat { get; set; } = "MM/DD/YYYY";
    
    // Operational Flags
    public bool IsActive { get; set; } = true;
    public string? ContactEmail { get; set; }
    
    // Extended Settings (Serialized JSON for future-proofing)
    public string? ExtendedSettingsJson { get; set; }
}
