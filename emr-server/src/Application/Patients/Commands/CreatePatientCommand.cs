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
    string Address,
    string City
) : IRequest<Guid>;
