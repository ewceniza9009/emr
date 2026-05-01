using Domain.Entities;
using Domain.Enums;

namespace Application.Common.Interfaces;

public interface ISchedulingService
{
    Task<List<ProviderDistance>> GetAvailableProvidersAsync(
        DateTimeOffset targetStart, 
        TimeSpan duration, 
        AppointmentModality modality, 
        Guid patientId,
        CancellationToken cancellationToken = default);
}
