using Infrastructure.Hubs;
using Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Api;

public class TelemetrySimulatorService : BackgroundService
{
    private readonly IHubContext<TelemetryHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TelemetrySimulatorService> _logger;

    private int _cachedSyncIntervalMs = 5000;
    private bool _telemetryEnabled = true;
    private DateTime _lastCacheTime = DateTime.MinValue;

    public TelemetrySimulatorService(
        IHubContext<TelemetryHub> hubContext,
        IServiceScopeFactory scopeFactory,
        ILogger<TelemetrySimulatorService> logger
    )
    {
        _hubContext = hubContext;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Telemetry Simulator Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var activeStreams = TelemetryHub.GetActivePatientStreams();
                if (activeStreams.Count == 0)
                {
                    await Task.Delay(2000, stoppingToken);
                    continue;
                }

                if (DateTime.UtcNow - _lastCacheTime > TimeSpan.FromSeconds(30))
                {
                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    var config = await dbContext.TenantConfigurations
                        .AsNoTracking()
                        .IgnoreQueryFilters()
                        .OrderBy(c => c.TenantConfigurationId)
                        .FirstOrDefaultAsync(stoppingToken);

                    _telemetryEnabled = config?.EnableTelemetry ?? true;
                    _cachedSyncIntervalMs = Math.Max(500, config?.IotSyncIntervalMs ?? 5000);
                    _lastCacheTime = DateTime.UtcNow;
                }

                if (_telemetryEnabled)
                {
                    var tasks = activeStreams.Select(patientId =>
                    {
                        var vitals = new
                        {
                            PatientId = patientId,
                            HeartRate = Random.Shared.Next(65, 86),
                            SpO2 = Random.Shared.Next(94, 100),
                            Temperature = Math.Round(97.0 + (Random.Shared.NextDouble() * 2.5), 1),
                        };

                        return _hubContext
                            .Clients.Group(patientId)
                            .SendAsync("ReceiveVitals", vitals, stoppingToken);
                    });

                    await Task.WhenAll(tasks);
                }

                await Task.Delay(_cachedSyncIntervalMs, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while simulating telemetry data.");
                await Task.Delay(5000, stoppingToken);
            }
        }
    }
}
