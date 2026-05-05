using Domain.Enums;
using MediatR;

namespace Application.Patients.Commands;

public record AddContactCommand(
    Guid PatientId,
    string FirstName,
    string LastName,
    RelationshipType Relationship,
    string PhoneNumber,
    string Email,
    bool IsPrimaryContact,
    bool HasPowerOfAttorney,
    bool IsLegalGuardian,
    string? Notes = null
) : IRequest<Guid>;
