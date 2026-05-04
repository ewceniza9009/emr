using Domain.Enums;

namespace Application.Clinical.Dtos;

public record ClinicalEncounterDto(
    Guid EncounterId,
    Guid PatientId,
    Guid PractitionerId,
    Guid? AppointmentId,
    EncounterStatus Status,
    DateTimeOffset? AdmittedAt,
    DateTimeOffset? DischargedAt,
    List<VitalSignDto> VitalSigns
);
