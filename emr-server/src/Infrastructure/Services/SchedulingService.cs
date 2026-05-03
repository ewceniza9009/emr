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
                Latitude = p.Addresses.Where(a => a.IsPrimary).Select(a => a.Address.Latitude).FirstOrDefault(),
                Longitude = p.Addresses.Where(a => a.IsPrimary).Select(a => a.Address.Longitude).FirstOrDefault(),
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

        var scheduleBlocks = await _context.ScheduleBlocks
            .AsNoTracking()
            .Where(b => b.StartTime >= startOfToday && b.StartTime < endOfToday && b.Status == ScheduleBlockStatus.Blocked)
            .ToListAsync(cancellationToken);

        _logger.LogInformation(">>> DISCOVERY: Processing {StaffCount} clinicians with {ApptCount} appointments and {BlockCount} OOF blocks.", 
            staffData.Count, existingAppointments.Count, scheduleBlocks.Count);

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
                // 1. Conflict Check (In Memory) - Appointments & OOF Blocks
                var hasConflict = staffAppts.Any(a => 
                    time < a.ScheduledEnd && time.Add(duration) > a.ScheduledStart);
                
                if (!hasConflict)
                {
                    hasConflict = scheduleBlocks.Any(b => 
                        b.PractitionerId == staff.PractitionerId &&
                        time < b.EndTime && time.Add(duration) > b.StartTime);
                }
                
                if (hasConflict) continue;

                // 2. Geospatial Logic
                var anchor = staffAppts
                    .Where(a => a.ScheduledEnd <= time)
                    .OrderByDescending(a => a.ScheduledEnd)
                    .FirstOrDefault();

                double startLat = staff.Latitude ?? 14.5995;
                double startLon = staff.Longitude ?? 120.9842;

                var anchorAddr = anchor?.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
                if (anchorAddr?.Latitude.HasValue == true)
                {
                    startLat = anchorAddr.Latitude.Value;
                    startLon = anchorAddr.Longitude.Value;
                }

                double distance = 0;
                double travelTime = 15; // Buffer

                var patientAddr = patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
                if (patientAddr?.Latitude.HasValue == true)
                {
                    distance = GeoUtils.CalculateDistance(startLat, startLon, patientAddr.Latitude.Value, patientAddr.Longitude.Value);
                    travelTime = GeoUtils.EstimateTravelTimeMinutes(distance);
                }

                // EDGE CASE: Nonsense distance filter (e.g. > 150 miles / 5 hours)
                if (distance > 150) continue;

                // EDGE CASE: First appointment travel
                // If it's the first appointment, travel time starts from shiftStart
                var earliestArrival = anchor != null 
                    ? anchor.ScheduledEnd.AddMinutes(travelTime) 
                    : shiftStart.AddMinutes(travelTime);

                if (time < earliestArrival) continue;

                // EDGE CASE: Return trip stretching past office hours
                // Ensure they can get back home by shift end
                var appointmentEnd = time.Add(duration);
                double returnDistance = 0;
                if (patientAddr?.Latitude.HasValue == true && staff.Latitude.HasValue)
                {
                    returnDistance = GeoUtils.CalculateDistance(
                        patientAddr.Latitude.Value, 
                        patientAddr.Longitude.Value, 
                        staff.Latitude.Value, 
                        staff.Longitude.Value);
                }
                double returnTravelTime = GeoUtils.EstimateTravelTimeMinutes(returnDistance);

                if (appointmentEnd.AddMinutes(returnTravelTime) > shiftEnd)
                {
                    _logger.LogDebug(">>> REJECT: {Name} slot at {Time} would stretch return trip past {End}", 
                        staff.LastName, time.ToString("t"), shiftEnd.ToString("t"));
                    continue;
                }

                allSlots.Add(new ClinicalSlot
                {
                    PractitionerId = staff.PractitionerId,
                    StartTime = time,
                    EndTime = appointmentEnd,
                    DistanceInMiles = Math.Round(distance, 2),
                    TravelTimeInMinutes = Math.Round(travelTime, 0)
                });
            }
        }

        return allSlots.OrderBy(s => s.StartTime).ThenBy(s => s.TravelTimeInMinutes).ToList();
    }
}
