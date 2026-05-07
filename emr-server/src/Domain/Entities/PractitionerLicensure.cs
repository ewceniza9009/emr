using Domain.Common;

namespace Domain.Entities;

public class PractitionerLicensure : BaseEntity, ITenantEntity
{
    public Guid LicensureId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PractitionerId { get; set; }
    public string LicenseNumber { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public DateTimeOffset ExpiryDate { get; set; }
    public bool IsActive { get; set; } = true;

    public Practitioner Practitioner { get; set; } = null!;
}
