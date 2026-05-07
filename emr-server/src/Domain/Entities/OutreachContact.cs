using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class OutreachContact : BaseEntity, ITenantEntity
{
    public Guid OutreachContactId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PatientOutreachId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public RelationshipType Relationship { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public bool IsPrimaryContact { get; set; }

    public PatientOutreach PatientOutreach { get; set; } = null!;
}
