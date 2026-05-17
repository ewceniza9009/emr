using Domain.Common;

namespace Domain.Entities;

public class PatientAccount : BaseEntity, ITenantEntity
{
    public Guid PatientAccountId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; } // Multi-tenant isolation key
    public Guid PatientId { get; set; }
    public Guid UserId { get; set; } // Links to system user account (ApplicationUser)
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastLoginAt { get; set; }

    // Navigation Properties
    public Patient Patient { get; set; } = null!;
    public ICollection<CaregiverLink> CaregiverLinks { get; set; } = new List<CaregiverLink>();
}
