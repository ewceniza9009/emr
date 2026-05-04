using Domain.Enums;
using MediatR;

namespace Application.Outreach.Commands;

public record CreateOutreachCommand(
    string FirstName,
    string LastName,
    string? ReferralSource,
    string? PrimaryPhone,
    string? PrimaryEmail,
    string? Street,
    string? City,
    string? State,
    string? PostalCode,
    string? Notes
) : IRequest<Guid>;
