using Infrastructure.Hubs;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Api;

public class TelemetrySimulatorService : BackgroundService
{
    private readonly IHubContext<TelemetryHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TelemetrySimulatorService> _logger;
    private readonly Random _random = new();

    private List<Guid> _cachedPatientIds = new();
    private int _cachedSyncIntervalMs = 5000;
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
                // Cache DB results for 30 seconds to prevent DB lock contention and connection pool exhaustion
                if (DateTime.UtcNow - _lastCacheTime > TimeSpan.FromSeconds(30) || !_cachedPatientIds.Any())
                {
                    using var scope = _scopeFactory.CreateScope();
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                    _cachedPatientIds = await dbContext
                        .Patients
                        .IgnoreQueryFilters()
                        .Select(p => p.PatientId)
                        .ToListAsync(stoppingToken);

                    var config = await dbContext.TenantConfigurations.IgnoreQueryFilters().FirstOrDefaultAsync(stoppingToken);
                    _cachedSyncIntervalMs = config?.IotSyncIntervalMs ?? 5000;
                    
                    // Safe guard: minimum 500ms to avoid overloading SignalR and CPU
                    if (_cachedSyncIntervalMs < 500)
                    {
                        _cachedSyncIntervalMs = 500;
                    }

                    _lastCacheTime = DateTime.UtcNow;
                    _logger.LogInformation("Telemetry Simulator cached {Count} active patients. Sync Interval: {Ms}ms.", _cachedPatientIds.Count, _cachedSyncIntervalMs);
                }

                foreach (var patientId in _cachedPatientIds)
                {
                    var vitals = new
                    {
                        HeartRate = _random.Next(65, 86),
                        SpO2 = _random.Next(94, 100),
                        Temperature = Math.Round(97.0 + (_random.NextDouble() * 2.5), 1),
                    };

                    await _hubContext
                        .Clients.Group(patientId.ToString())
                        .SendAsync("ReceiveVitals", vitals, stoppingToken);
                }

                // Use the dynamic interval from cached config
                await Task.Delay(_cachedSyncIntervalMs, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while simulating telemetry data.");
                await Task.Delay(5000, stoppingToken); // Fallback delay on error
            }
        }
    }
}
