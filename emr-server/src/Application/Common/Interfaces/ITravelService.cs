namespace Application.Common.Interfaces;

public interface ITravelService
{
    Task<bool> ValidateTravelBufferAsync(
        Guid practitionerId,
        Guid appointmentId,
        CancellationToken ct
    );
}
