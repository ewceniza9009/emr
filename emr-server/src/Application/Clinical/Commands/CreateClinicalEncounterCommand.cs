using MediatR;

namespace Application.Clinical.Commands;

public record CreateClinicalEncounterCommand(
    Guid PatientId,
    Guid PractitionerId,
    Guid? AppointmentId
) : IRequest<Guid>;
