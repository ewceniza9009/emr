using Infrastructure.Hubs;
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
                // CRITICAL: IgnoreQueryFilters() bypasses multi-tenancy filter.
                // Background services have no HttpContext, so CurrentTenantId = Guid.Empty,
                // which silently filters out ALL real encounters. This is safe for a simulator.
                // Get all patients with active encounters
                var activeEncounterPatientIds = await dbContext
                    .ClinicalEncounters
                    .IgnoreQueryFilters()
                    .Where(e =>
                        e.Status == EncounterStatus.InProgress
                        || e.Status == EncounterStatus.Arrived
                        || e.Status == EncounterStatus.Triaged
                    )
                    .Select(e => e.PatientId)
                    .ToListAsync(stoppingToken);

                // Get all patients with active appointments
                var activeAppointmentPatientIds = await dbContext
                    .Appointments
                    .IgnoreQueryFilters()
                    .Where(a => a.Status == AppointmentStatus.InProgress)
                    .Select(a => a.PatientId)
                    .ToListAsync(stoppingToken);

                var activePatientIds = activeEncounterPatientIds
                    .Union(activeAppointmentPatientIds)
                    .Distinct()
                    .ToList();

                _logger.LogDebug("Telemetry Simulator found {Count} active patients.", activePatientIds.Count);

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
                await Task.Delay(2000, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
