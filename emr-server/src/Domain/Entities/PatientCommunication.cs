using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class PatientPhone : BaseEntity, ITenantEntity
{
    public Guid PhoneId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public AddressType Type { get; set; }
    public bool IsPrimary { get; set; }

    public Patient Patient { get; set; } = null!;
}

public class PatientEmail : BaseEntity, ITenantEntity
{
    public Guid EmailId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string EmailAddress { get; set; } = string.Empty;
    public AddressType Type { get; set; }
    public bool IsPrimary { get; set; }

    public Patient Patient { get; set; } = null!;
}
