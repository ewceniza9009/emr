namespace Application.Common.Interfaces;

public interface ICareSourceClient
{
    Task<bool> ReportPalliativeMetricsAsync(Guid patientId, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken cancellationToken = default);
}
