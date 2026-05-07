using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class EntityAddress : BaseEntity, ITenantEntity
{
    public Guid EntityAddressId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    
    // Poly-fill style IDs (Nullable for cross-entity support)
    public Guid? PatientId { get; set; }
    public Guid? PractitionerId { get; set; }
    
    public Address Address { get; set; } = new Address();
    public AddressType Type { get; set; } = AddressType.Home;
    public bool IsPrimary { get; set; }
    
    // Navigation
    public Patient? Patient { get; set; }
    public Practitioner? Practitioner { get; set; }
}
