using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class PatientContact : BaseEntity, ITenantEntity
{
    public Guid ContactId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public RelationshipType Relationship { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsPrimaryContact { get; set; }
    public bool HasPowerOfAttorney { get; set; }
    public bool IsLegalGuardian { get; set; }
    public string? Notes { get; set; }

    public Patient Patient { get; set; } = null!;
}
