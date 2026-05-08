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
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            await _semaphore.WaitAsync(cancellationToken);

            // HARDENED DATE LOGIC: Respect the offset provided by the caller (Clinical Timezone)
            var offset = targetStart.Offset;
            var targetDate = targetStart.Date;
            var dayOfWeek = targetDate.DayOfWeek;

            // If hour is 0 (midnight), scan the WHOLE day. Otherwise, scan the specific AM/PM window.
            var scanWholeDay = targetStart.Hour == 0;
            var isAm = targetStart.Hour < 13;
            var slotWindowStart = new DateTimeOffset(
                targetDate.AddHours(scanWholeDay ? 8 : (isAm ? 8 : 13)),
                offset
            );
            var slotWindowEnd = new DateTimeOffset(
                targetDate.AddHours(scanWholeDay ? 18 : (isAm ? 13 : 18)),
                offset
            );

            _logger.LogInformation(
                ">>> GEOSPATIAL RADAR: Scanning for {Day} (Range: {Start} - {End} Offset: {Offset})",
                dayOfWeek,
                slotWindowStart.ToString("t"),
                slotWindowEnd.ToString("t"),
                offset
            );

            // 1. Fetch Target Patient Coordinates
            var patient = await _context
                .Patients.AsNoTracking()
                .Include(p => p.Addresses)
                    .ThenInclude(a => a.Address)
                .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);

            if (patient == null)
            {
                _logger.LogWarning("!!! PATIENT NOT FOUND: {Id}", patientId);
            }

            // 2. Batch Fetch all clinical staff and their shifts
            var staffData = await _context
                .Practitioners.AsNoTracking()
                .Where(p => p.IsActive && (p.IsCareNavigator || p.IsSupportingClinician))
                .Select(p => new
                {
                    p.PractitionerId,
                    p.LastName,
                    Latitude = p.Addresses
                        .Where(a => a.IsPrimary)
                        .Select(a => (double?)a.Address.Latitude)
                        .FirstOrDefault(),
                    Longitude = p.Addresses
                        .Where(a => a.IsPrimary)
                        .Select(a => (double?)a.Address.Longitude)
                        .FirstOrDefault(),
                    Shifts = _context
                        .ProviderShifts.Where(s =>
                            s.PractitionerId == p.PractitionerId && s.DayOfWeek == dayOfWeek
                        )
                        .Select(s => new { s.StartTime, s.EndTime })
                        .ToList(),
                })
                .ToListAsync(cancellationToken);

            // 3. Batch Fetch all appointments for the day to avoid N+1 inside the loop
            var startOfToday = new DateTimeOffset(targetDate, TimeSpan.Zero); // Force UTC for PG
            var endOfToday = startOfToday.AddDays(1);

            var existingAppointments = await _context
                .Appointments.AsNoTracking()
                .Include(a => a.Patient)
                .Where(a => a.ScheduledStart >= startOfToday && a.ScheduledStart < endOfToday)
                .ToListAsync(cancellationToken);

            var scheduleBlocks = await _context
                .ScheduleBlocks.AsNoTracking()
                .Where(b =>
                    b.StartTime >= startOfToday
                    && b.StartTime < endOfToday
                    && b.Status == ScheduleBlockStatus.Blocked
                )
                .ToListAsync(cancellationToken);

            _logger.LogInformation(
                ">>> DISCOVERY: Processing {StaffCount} clinicians with {ApptCount} appointments and {BlockCount} OOF blocks.",
                staffData.Count,
                existingAppointments.Count,
                scheduleBlocks.Count
            );

            var allSlots = new List<ClinicalSlot>();

            foreach (var staff in staffData)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var shift = staff.Shifts.FirstOrDefault();
                TimeSpan shiftStartRaw;
                TimeSpan shiftEndRaw;

                if (shift == null)
                {
                    _logger.LogInformation(
                        ">>> FALLBACK: {Name} has no defined shift. Using default 08:00-17:00.",
                        staff.LastName
                    );
                    shiftStartRaw = new TimeSpan(8, 0, 0);
                    shiftEndRaw = new TimeSpan(17, 0, 0);
                }
                else
                {
                    shiftStartRaw = shift.StartTime;
                    shiftEndRaw = shift.EndTime;
                }

                var shiftStart = new DateTimeOffset(targetDate.Add(shiftStartRaw), offset);
                var shiftEnd = new DateTimeOffset(targetDate.Add(shiftEndRaw), offset);

                // Effective window is intersection of Slot and Shift
                var effectiveStart = slotWindowStart > shiftStart ? slotWindowStart : shiftStart;
                var effectiveEnd = slotWindowEnd < shiftEnd ? slotWindowEnd : shiftEnd;

                // Get this clinician's appointments for today
                var staffAppts = existingAppointments
                    .Where(a => a.PractitionerId == staff.PractitionerId)
                    .OrderBy(a => a.ScheduledStart)
                    .ToList();

                // SCAN THE WINDOW
                for (
                    var time = effectiveStart;
                    time.Add(duration) <= effectiveEnd;
                    time = time.AddMinutes(15)
                )
                {
                    // Check cancellation inside the tight loop for ultra-responsiveness
                    if (allSlots.Count % 10 == 0)
                        cancellationToken.ThrowIfCancellationRequested();

                    // 1. Conflict Check (In Memory) - Appointments & OOF Blocks
                    var hasConflict = staffAppts.Any(a =>
                        time < a.ScheduledEnd && time.Add(duration) > a.ScheduledStart
                    );

                    if (!hasConflict)
                    {
                        hasConflict = scheduleBlocks.Any(b =>
                            b.PractitionerId == staff.PractitionerId
                            && time < b.EndTime
                            && time.Add(duration) > b.StartTime
                        );
                    }

                    if (hasConflict)
                        continue;

                    // 2. Geospatial Logic
                    var anchor = staffAppts
                        .Where(a => a.ScheduledEnd <= time)
                        .OrderByDescending(a => a.ScheduledEnd)
                        .FirstOrDefault();

                    if (!staff.Latitude.HasValue || !staff.Longitude.HasValue)
                    {
                        _logger.LogWarning(">>> EXCLUDING: Practitioner {Id} lacks a valid primary address for geospatial routing.", staff.PractitionerId);
                        continue;
                    }

                    double startLat = staff.Latitude.Value;
                    double startLon = staff.Longitude.Value;

                    var anchorAddr = anchor
                        ?.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)
                        ?.Address;
                    if (
                        anchorAddr != null
                        && anchorAddr.Latitude.HasValue
                        && anchorAddr.Longitude.HasValue
                    )
                    {
                        startLat = anchorAddr.Latitude.Value;
                        startLon = anchorAddr.Longitude.Value;
                    }

                    double distance = 0;
                    double travelTime = 15; // Buffer

                    var patientAddr = patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
                    if (
                        patientAddr?.Latitude.HasValue == true
                        && patientAddr?.Longitude.HasValue == true
                    )
                    {
                        distance = GeoUtils.CalculateDistance(
                            startLat,
                            startLon,
                            patientAddr.Latitude.Value,
                            patientAddr.Longitude.Value
                        );
                        travelTime = GeoUtils.EstimateTravelTimeMinutes(distance);
                    }

                    if (distance > 150)
                        continue;

                    var earliestArrival =
                        anchor != null
                            ? anchor.ScheduledEnd.AddMinutes(travelTime)
                            : shiftStart.AddMinutes(travelTime);

                    if (time < earliestArrival)
                        continue;

                    var appointmentEnd = time.Add(duration);
                    double returnDistance = 0;
                    if (
                        patientAddr?.Latitude.HasValue == true
                        && patientAddr?.Longitude.HasValue == true
                        && staff.Latitude.HasValue
                        && staff.Longitude.HasValue
                    )
                    {
                        returnDistance = GeoUtils.CalculateDistance(
                            patientAddr.Latitude.Value,
                            patientAddr.Longitude.Value,
                            staff.Latitude.Value,
                            staff.Longitude.Value
                        );
                    }
                    double returnTravelTime = GeoUtils.EstimateTravelTimeMinutes(returnDistance);

                    if (appointmentEnd.AddMinutes(returnTravelTime) > shiftEnd)
                        continue;

                    allSlots.Add(
                        new ClinicalSlot
                        {
                            PractitionerId = staff.PractitionerId,
                            StartTime = time,
                            EndTime = appointmentEnd,
                            DistanceInMiles = Math.Round(distance, 2),
                            TravelTimeInMinutes = Math.Max(15, Math.Round(travelTime, 0)),
                        }
                    );
                }
            }

            return allSlots.OrderBy(s => s.StartTime).ThenBy(s => s.TravelTimeInMinutes).ToList();
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug(">>> GEOSPATIAL RADAR: Scan cancelled by client.");
            return new List<ClinicalSlot>();
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<(double distance, double travelTime)> RecalculateAppointmentStatsAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default
    )
    {
        var appt = await _context
            .Appointments.Include(a => a.Patient)
                .ThenInclude(p => p.Addresses)
                    .ThenInclude(a => a.Address)
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId, cancellationToken);

        if (
            appt == null
            || appt.Modality == AppointmentModality.TelehealthVideo
            || appt.Modality == AppointmentModality.Telephone
        )
            return (0, 0);

        var patientAddr = appt.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
        if (
            patientAddr == null
            || !patientAddr.Latitude.HasValue
            || !patientAddr.Longitude.HasValue
        )
            return (0, 0);

        // Find previous appointment on the same day for this practitioner
        var startOfDay = new DateTimeOffset(appt.ScheduledStart.Date, TimeSpan.Zero);
        var prevAppt = await _context
            .Appointments.Include(a => a.Patient)
                .ThenInclude(p => p.Addresses)
                    .ThenInclude(a => a.Address)
            .Where(a =>
                a.PractitionerId == appt.PractitionerId
                && a.ScheduledStart < appt.ScheduledStart
                && a.ScheduledStart >= startOfDay
                && a.AppointmentId != appt.AppointmentId
            )
            .OrderByDescending(a => a.ScheduledStart)
            .FirstOrDefaultAsync(cancellationToken);

        double startLat,
            startLon;

        if (prevAppt != null)
        {
            var prevAddr = prevAppt.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
            if (prevAddr != null && prevAddr.Latitude.HasValue && prevAddr.Longitude.HasValue)
            {
                startLat = prevAddr.Latitude.Value;
                startLon = prevAddr.Longitude.Value;
            }
            else
            {
                // Fallback to practitioner home if prev appt has no address
                var practitioner = await _context
                    .Practitioners.Include(p => p.Addresses)
                        .ThenInclude(a => a.Address)
                    .FirstOrDefaultAsync(
                        p => p.PractitionerId == appt.PractitionerId,
                        cancellationToken
                    );
                var home = practitioner?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
                // Fallback to localized Philippine center (Quezon City)
                startLat = home?.Latitude ?? 14.6760;
                startLon = home?.Longitude ?? 121.0437;
            }
        }
        else
        {
            // First appointment of the day, use practitioner home
            var practitioner = await _context
                .Practitioners.Include(p => p.Addresses)
                    .ThenInclude(a => a.Address)
                .FirstOrDefaultAsync(
                    p => p.PractitionerId == appt.PractitionerId,
                    cancellationToken
                );
            var home = practitioner?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
            // Fallback to localized Philippine center (Quezon City)
            startLat = home?.Latitude ?? 14.6760;
            startLon = home?.Longitude ?? 121.0437;
        }

        double distance = GeoUtils.CalculateDistance(
            startLat,
            startLon,
            patientAddr.Latitude.Value,
            patientAddr.Longitude.Value
        );
        double travelTime = Math.Max(15, GeoUtils.EstimateTravelTimeMinutes(distance));

        return (Math.Round(distance, 2), Math.Round(travelTime, 0));
    }
}
