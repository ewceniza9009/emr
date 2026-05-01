using MediatR;
using Domain.Enums;

namespace Application.Outreach.Commands;

public record CreateOutreachCommand(
    string FirstName,
    string LastName,
    string? ReferralSource,
    string? PrimaryPhone,
    string? PrimaryEmail,
    string? Notes
) : IRequest<Guid>;
