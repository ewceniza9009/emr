using Api.Hubs;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Api;

public class TelemetrySimulatorService : BackgroundService
{
    private readonly IHubContext<TelemetryHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TelemetrySimulatorService> _logger;
    private readonly Random _random = new();

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
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // Get all patients to simulate data for
                var activePatientIds = await dbContext
                    .ClinicalEncounters.Where(e =>
                        e.Status == EncounterStatus.InProgress
                        || e.Status == EncounterStatus.Arrived
                        || e.Status == EncounterStatus.Triaged
                    )
                    .Select(e => e.PatientId)
                    .Distinct()
                    .ToListAsync(stoppingToken);

                foreach (var patientId in activePatientIds)
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
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while simulating telemetry data.");
            }

            try
            {
                await Task.Delay(10000, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
