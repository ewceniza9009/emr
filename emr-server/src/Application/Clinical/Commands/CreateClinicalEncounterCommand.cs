using MediatR;

namespace Application.Clinical.Commands;

public record CreateClinicalEncounterCommand(
    Guid PatientId,
    Guid PractitionerId,
    Guid? AppointmentId,
    string ChiefComplaint,
    string Notes
) : IRequest<Guid>;
