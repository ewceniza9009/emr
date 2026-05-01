namespace Application.Patients.Dtos;

public class PatientDto
{
    public Guid PatientId { get; set; }
    public string Mrn { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime Dob { get; set; }
    public string BiologicalSex { get; set; } = string.Empty;
    public string? GenderIdentity { get; set; }
    public string? PhilhealthNumber { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<PatientPhoneDto> Phones { get; set; } = new();
    public List<PatientEmailDto> Emails { get; set; } = new();
}
