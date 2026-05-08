using MediatR;

namespace Application.Clinical.Commands;

public record CreateClinicalEncounterCommand : IRequest<Guid>
{
    public Guid PatientId { get; init; }
    public Guid PractitionerId { get; init; }
    public Guid? AppointmentId { get; init; }
    public string ChiefComplaint { get; init; } = string.Empty;
    public string Notes { get; init; } = string.Empty;
    public int? PpsScore { get; init; }
}
