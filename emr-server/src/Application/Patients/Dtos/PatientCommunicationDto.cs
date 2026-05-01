using Domain.Enums;

namespace Application.Patients.Dtos;

public class PatientPhoneDto
{
    public Guid PhoneId { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public AddressType Type { get; set; }
    public bool IsPrimary { get; set; }
}

public class PatientEmailDto
{
    public Guid EmailId { get; set; }
    public string EmailAddress { get; set; } = string.Empty;
    public AddressType Type { get; set; }
    public bool IsPrimary { get; set; }
}
