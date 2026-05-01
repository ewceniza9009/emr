using Domain.Enums;

namespace Domain.Entities;

public class PatientPhone
{
    public Guid PhoneId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public AddressType Type { get; set; }
    public bool IsPrimary { get; set; }

    public Patient Patient { get; set; } = null!;
}

public class PatientEmail
{
    public Guid EmailId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public string EmailAddress { get; set; } = string.Empty;
    public AddressType Type { get; set; }
    public bool IsPrimary { get; set; }

    public Patient Patient { get; set; } = null!;
}
