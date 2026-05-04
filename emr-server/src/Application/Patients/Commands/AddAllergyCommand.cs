using Domain.Enums;
using MediatR;

namespace Application.Patients.Commands;

public record AddAllergyCommand : IRequest<Guid>
{
    public Guid PatientId { get; init; }
    public string Allergen { get; init; } = string.Empty;
    public SeverityLevel Severity { get; init; }
    public string Reaction { get; init; } = string.Empty;
    public DateTimeOffset IdentifiedAt { get; init; }
}
