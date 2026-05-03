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
        CancellationToken cancellationToken = default);

    Task<(double distance, double travelTime)> RecalculateAppointmentStatsAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default);
}
