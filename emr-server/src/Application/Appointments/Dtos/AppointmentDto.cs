using Domain.Enums;

namespace Application.Appointments.Dtos;

public record AppointmentDto(
    Guid AppointmentId,
    Guid PatientId,
    VisitType VisitType,
    string Status,
    DateTimeOffset ScheduledStart,
    DateTimeOffset ScheduledEnd,
    AppointmentModality Modality,
    string? MeetingLink
);
