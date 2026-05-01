using Application.Common.Interfaces;
using Application.Common.Utils;
using Domain.Entities;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SchedulingService : ISchedulingService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<SchedulingService> _logger;
    private readonly SemaphoreSlim _semaphore = new(10);

    public SchedulingService(IApplicationDbContext context, ILogger<SchedulingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<ProviderDistance>> GetAvailableProvidersAsync(
        DateTimeOffset targetStart, 
        TimeSpan duration, 
        AppointmentModality modality, 
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        var targetEnd = targetStart.Add(duration);
        var dayOfWeek = targetStart.DayOfWeek;

        // 1. Fetch Target Patient Coordinates
        var patient = await _context.Patients
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);

        if (patient == null || !patient.Latitude.HasValue || !patient.Longitude.HasValue)
        {
            _logger.LogWarning("Patient {Id} has no geocoded location. Defaulting to base distance.", patientId);
        }

        // 2. Get all active practitioners with shifts on this day
        var activePractitioners = await _context.Practitioners
            .Where(p => p.IsActive)
            .Where(p => _context.ProviderShifts.Any(s => s.PractitionerId == p.PractitionerId && s.DayOfWeek == dayOfWeek))
            .ToListAsync(cancellationToken);

        var results = new List<ProviderDistance>();
        var tasks = activePractitioners.Select(async practitioner =>
        {
            await _semaphore.WaitAsync(cancellationToken);
            try
            {
                var shift = await _context.ProviderShifts
                    .FirstOrDefaultAsync(s => s.PractitionerId == practitioner.PractitionerId && s.DayOfWeek == dayOfWeek, cancellationToken);
                
                if (shift == null) return;

                var shiftStart = targetStart.Date.Add(shift.StartTime);
                var shiftEnd = targetStart.Date.Add(shift.EndTime);

                if (targetStart < shiftStart || targetEnd > shiftEnd) return;

                var hasConflict = await _context.Appointments
                    .AnyAsync(a => a.PractitionerId == practitioner.PractitionerId &&
                                   a.ScheduledStart < targetEnd &&
                                   a.ScheduledEnd > targetStart, cancellationToken);
                
                if (hasConflict) return;

                double distance = 0;
                double travelTime = 0;

                if (modality == AppointmentModality.InPersonHomeVisit || modality == AppointmentModality.InPersonFacility)
                {
                    // Senior Chaining: Find the latest appointment
                    var latestAppt = await _context.Appointments
                        .Include(a => a.Patient)
                        .Where(a => a.PractitionerId == practitioner.PractitionerId && a.ScheduledEnd <= targetStart && a.ScheduledStart.Date == targetStart.Date)
                        .OrderByDescending(a => a.ScheduledEnd)
                        .FirstOrDefaultAsync(cancellationToken);

                    double startLat = practitioner.BaseLatitude ?? 14.5995; // Default to Manila Center if not set
                    double startLon = practitioner.BaseLongitude ?? 120.9842;

                    if (latestAppt?.Patient != null && latestAppt.Patient.Latitude.HasValue)
                    {
                        startLat = latestAppt.Patient.Latitude.Value;
                        startLon = latestAppt.Patient.Longitude.Value;
                    }

                    if (patient?.Latitude.HasValue == true)
                    {
                        // REAL-TIME GEOSPATIAL CALCULATION
                        distance = GeoUtils.CalculateDistance(startLat, startLon, patient.Latitude.Value, patient.Longitude.Value);
                        travelTime = GeoUtils.EstimateTravelTimeMinutes(distance);
                    }
                }

                lock (results)
                {
                    results.Add(new ProviderDistance
                    {
                        ProviderId = practitioner.PractitionerId,
                        DistanceInMiles = Math.Round(distance, 2),
                        TravelTimeInMinutes = Math.Round(travelTime, 0),
                        FromTime = targetStart
                    });
                }
            }
            finally
            {
                _semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);

        return results.OrderBy(r => r.TravelTimeInMinutes).ToList();
    }
}
