namespace Application.Common.Interfaces;

public interface ITravelService
{
    Task<bool> ValidateTravelBufferAsync(
        Guid practitionerId,
        Guid appointmentId,
        CancellationToken ct
    );

    Task<(double distanceInMiles, double durationInMinutes)> GetDistanceAndDurationAsync(
        double startLat,
        double startLon,
        double endLat,
        double endLon,
        CancellationToken ct = default
    );
}
