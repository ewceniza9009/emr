using MediatR;

namespace Application.Patients.Commands;

public record CreatePatientCommand(
    string Mrn,
    string FirstName,
    string LastName,
    DateTime Dob,
    string BiologicalSex,
    string? GenderIdentity,
    string? PhilhealthNumber,
    string? CivilStatus,
    string? Religion,
    string? Occupation,
    string? PlaceOfBirth,
    string? Nationality,
    string? Language,
    string Street,
    string City,
    string State,
    string PostalCode,
    double? Latitude = null,
    double? Longitude = null
) : IRequest<Guid>;
