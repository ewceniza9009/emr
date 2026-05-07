using Domain.Common;

namespace Domain.Entities;

public class PractitionerServiceArea : BaseEntity, ITenantEntity
{
    public Guid ServiceAreaId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PractitionerId { get; set; }
    public string ZipCode { get; set; } = string.Empty;
    public string County { get; set; } = string.Empty;

    public Practitioner Practitioner { get; set; } = null!;
}
