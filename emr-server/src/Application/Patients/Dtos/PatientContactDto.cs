using Domain.Enums;

namespace Application.Patients.Dtos;

public class PatientContactDto
{
    public Guid PatientContactId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public RelationshipType Relationship { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsPrimaryContact { get; set; }
    public bool IsPoa { get; set; } // Mapped from HasPowerOfAttorney
    public bool IsLegalGuardian { get; set; }
    public string? Notes { get; set; }
}
