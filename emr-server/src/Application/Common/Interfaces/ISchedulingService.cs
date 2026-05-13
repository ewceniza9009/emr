using Domain.Entities;
using Domain.Enums;

namespace Application.Common.Interfaces;

public interface ISchedulingService
{
    Task<List<ClinicalSlot>> GetAvailableProvidersAsync(
        DateTimeOffset targetStart,
        TimeSpan duration,
        AppointmentModality modality,
        Guid patientId,
        Guid? excludeAppointmentId = null,
        CancellationToken cancellationToken = default
    );

    Task<(double distance, double travelTime)> RecalculateAppointmentStatsAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default
    );

    Task<(bool isValid, string? reason)> ValidateLogisticsAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default
    );

    Task<
        List<Application.Appointments.Dtos.ReassignmentProviderDto>
    > GetAvailableProvidersForReassignmentAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default
    );
}
