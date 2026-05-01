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

    public async Task<List<ClinicalSlot>> GetAvailableProvidersAsync(
        DateTimeOffset targetStart, 
        TimeSpan duration, 
        AppointmentModality modality, 
        Guid patientId,
        CancellationToken cancellationToken = default)
    {
        // HARDENED DATE LOGIC: Use the date part of the targetStart in the clinician's timezone context
        var targetDate = targetStart.Date;
        var dayOfWeek = targetDate.DayOfWeek;
        
        // If hour is 0 (midnight), scan the WHOLE day. Otherwise, scan the specific AM/PM window.
        var scanWholeDay = targetStart.Hour == 0;
        var isAm = targetStart.Hour < 13;
        var slotWindowStart = new DateTimeOffset(targetDate.AddHours(scanWholeDay ? 8 : (isAm ? 8 : 13)), TimeSpan.Zero);
        var slotWindowEnd = new DateTimeOffset(targetDate.AddHours(scanWholeDay ? 18 : (isAm ? 13 : 18)), TimeSpan.Zero);

        _logger.LogInformation(">>> GEOSPATIAL RADAR: Scanning for {Day} (Range: {Start} - {End})", 
            dayOfWeek, slotWindowStart.ToString("t"), slotWindowEnd.ToString("t"));

        // 1. Fetch Target Patient Coordinates
        var patient = await _context.Patients
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);
        
        if (patient == null) {
            _logger.LogWarning("!!! PATIENT NOT FOUND: {Id}", patientId);
        }

        // 2. Batch Fetch all clinical staff and their shifts
        var staffData = await _context.Practitioners
            .AsNoTracking()
            .Where(p => p.IsActive && (p.IsCareNavigator || p.IsSupportingClinician))
            .Select(p => new {
                p.PractitionerId,
                p.LastName,
                p.BaseLatitude,
                p.BaseLongitude,
                Shifts = _context.ProviderShifts
                    .Where(s => s.PractitionerId == p.PractitionerId && s.DayOfWeek == dayOfWeek)
                    .Select(s => new { s.StartTime, s.EndTime })
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        // 3. Batch Fetch all appointments for the day to avoid N+1 inside the loop
        var startOfToday = new DateTimeOffset(targetDate, TimeSpan.Zero); // Force UTC for PG
        var endOfToday = startOfToday.AddDays(1);

        var existingAppointments = await _context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)
            .Where(a => a.ScheduledStart >= startOfToday && a.ScheduledStart < endOfToday)
            .ToListAsync(cancellationToken);

        _logger.LogInformation(">>> DISCOVERY: Processing {StaffCount} clinicians with {ApptCount} existing appointments.", staffData.Count, existingAppointments.Count);

        var allSlots = new List<ClinicalSlot>();
        
        foreach (var staff in staffData)
        {
            var shift = staff.Shifts.FirstOrDefault();
            if (shift == null) {
                _logger.LogWarning(">>> SKIP: {Name} has no shift defined for {Day}", staff.LastName, dayOfWeek);
                continue;
            }

            var shiftStart = new DateTimeOffset(targetDate.Add(shift.StartTime), TimeSpan.Zero);
            var shiftEnd = new DateTimeOffset(targetDate.Add(shift.EndTime), TimeSpan.Zero);
            
            _logger.LogDebug(">>> WINDOW: {Name} | Shift: {S}-{E} | Scan: {SS}-{SE}", 
                staff.LastName, shiftStart.ToString("t"), shiftEnd.ToString("t"), slotWindowStart.ToString("t"), slotWindowEnd.ToString("t"));

            // Effective window is intersection of Slot and Shift
            var effectiveStart = slotWindowStart > shiftStart ? slotWindowStart : shiftStart;
            var effectiveEnd = slotWindowEnd < shiftEnd ? slotWindowEnd : shiftEnd;

            // Get this clinician's appointments for today
            var staffAppts = existingAppointments
                .Where(a => a.PractitionerId == staff.PractitionerId)
                .OrderBy(a => a.ScheduledStart)
                .ToList();

            // SCAN THE WINDOW
            for (var time = effectiveStart; time.Add(duration) <= effectiveEnd; time = time.AddMinutes(15))
            {
                // 1. Conflict Check (In Memory)
                var hasConflict = staffAppts.Any(a => 
                    time < a.ScheduledEnd && time.Add(duration) > a.ScheduledStart);
                
                if (hasConflict) continue;

                // 2. Geospatial Logic
                var anchor = staffAppts
                    .Where(a => a.ScheduledEnd <= time)
                    .OrderByDescending(a => a.ScheduledEnd)
                    .FirstOrDefault();

                double startLat = staff.BaseLatitude ?? 14.5995;
                double startLon = staff.BaseLongitude ?? 120.9842;

                if (anchor?.Patient != null && anchor.Patient.Latitude.HasValue)
                {
                    startLat = anchor.Patient.Latitude.Value;
                    startLon = anchor.Patient.Longitude.Value;
                }

                double distance = 0;
                double travelTime = 15; // Buffer

                if (patient?.Latitude.HasValue == true)
                {
                    distance = GeoUtils.CalculateDistance(startLat, startLon, patient.Latitude.Value, patient.Longitude.Value);
                    travelTime = GeoUtils.EstimateTravelTimeMinutes(distance);
                }

                var earliestArrival = anchor != null ? anchor.ScheduledEnd.AddMinutes(travelTime) : shiftStart;

                if (time >= earliestArrival)
                {
                    allSlots.Add(new ClinicalSlot
                    {
                        PractitionerId = staff.PractitionerId,
                        StartTime = time,
                        EndTime = time.Add(duration),
                        DistanceInMiles = Math.Round(distance, 2),
                        TravelTimeInMinutes = Math.Round(travelTime, 0)
                    });
                }
            }
        }

        return allSlots.OrderBy(s => s.StartTime).ThenBy(s => s.TravelTimeInMinutes).ToList();
    }
}
