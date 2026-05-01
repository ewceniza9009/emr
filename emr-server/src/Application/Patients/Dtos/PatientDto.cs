namespace Application.Patients.Dtos;

public record PatientDto(
    Guid PatientId,
    string Mrn,
    string FirstName,
    string LastName,
    DateTime Dob,
    string BiologicalSex,
    string? GenderIdentity,
    string? PhilhealthNumber,
    string Address,
    string City,
    DateTime CreatedAt
);
