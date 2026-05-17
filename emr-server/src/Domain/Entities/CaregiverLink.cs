using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class CaregiverLink : BaseEntity, ITenantEntity
{
    public Guid CaregiverLinkId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; } // Multi-tenant isolation key
    public Guid PatientAccountId { get; set; }
    public Guid? CaregiverUserId { get; set; } // Optional link to caregiver's system user account
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public RelationshipType Relationship { get; set; } = RelationshipType.Other;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public bool IsPrimary { get; set; } = false;
    public bool AccessGranted { get; set; } = true;

    // Navigation Properties
    public PatientAccount PatientAccount { get; set; } = null!;
}
