using System.Collections.Generic;
using Application.Common.Dtos;

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
    public string? CivilStatus { get; set; }
    public string? Religion { get; set; }
    public string? Occupation { get; set; }
    public string? PlaceOfBirth { get; set; }
    public string? Nationality { get; set; }
    public string? Language { get; set; }

    public ICollection<EntityAddressDto> Addresses { get; set; } = new List<EntityAddressDto>();

    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<PatientPhoneDto> Phones { get; set; } = new List<PatientPhoneDto>();
    public ICollection<PatientEmailDto> Emails { get; set; } = new List<PatientEmailDto>();
    public ICollection<PatientContactDto> Contacts { get; set; } = new List<PatientContactDto>();
    public ICollection<PatientDocumentDto> Documents { get; set; } = new List<PatientDocumentDto>();
    public string? VisitStatus { get; set; }
}
