namespace Application.Common.Interfaces;

public interface IMrnGenerator
{
    Task<string> GenerateMrnAsync(CancellationToken cancellationToken = default);
}
