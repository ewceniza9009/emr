using Application.Common.Interfaces;
using Application.Common.Utils;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SchedulingService : ISchedulingService
{
    private readonly IDbContextFactory<ApplicationDbContext> _dbFactory;
    private readonly ITravelService _travelService;
    private readonly ILogger<SchedulingService> _logger;
    private readonly SemaphoreSlim _semaphore = new(10);

    private const int FALLBACK_IN_PERSON_BUFFER = 5;
    private const int TELEHEALTH_BUFFER_MINS = 3;

    public SchedulingService(
        IDbContextFactory<ApplicationDbContext> dbFactory,
        ITravelService travelService,
        ILogger<SchedulingService> logger
    )
    {
        _dbFactory = dbFactory;
        _travelService = travelService;
        _logger = logger;
    }

    public async Task<List<ClinicalSlot>> GetAvailableProvidersAsync(
        DateTimeOffset targetStart,
        TimeSpan duration,
        AppointmentModality modality,
        Guid patientId,
        Guid? excludeAppointmentId = null,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            await _semaphore.WaitAsync(cancellationToken);

            var offset = targetStart.Offset;
            var targetDate = targetStart.Date;
            var dayOfWeek = targetDate.DayOfWeek;

            using var context = await _dbFactory.CreateDbContextAsync(cancellationToken);
            var settings = await context.TenantConfigurations.FirstOrDefaultAsync(
                cancellationToken
            );

            var amStart = settings?.AmStartHour ?? 8;
            var pmStart = settings?.PmStartHour ?? 13;
            var dayEnd = settings?.DayEndHour ?? 18;
            var safetyBuffer = settings?.EngineSafetyDriveMins ?? FALLBACK_IN_PERSON_BUFFER;

            var scanWholeDay = true; // ALWAYS scan the whole day to ensure continuous availability
            var slotWindowStart = new DateTimeOffset(targetDate.AddHours(amStart), offset);
            var slotWindowEnd = new DateTimeOffset(targetDate.AddHours(dayEnd), offset);

            _logger.LogDebug(
                ">>> GEOSPATIAL RADAR: Scanning for {Day} (Range: {Start} - {End} Offset: {Offset})",
                dayOfWeek,
                slotWindowStart.ToString("t"),
                slotWindowEnd.ToString("t"),
                offset
            );

            var patient = await context
                .Patients.AsNoTracking()
                .Include(p => p.Addresses)
                    .ThenInclude(a => a.Address)
                .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);

            if (patient == null)
            {
                _logger.LogWarning("!!! PATIENT NOT FOUND: {Id}", patientId);
            }

            var staffInfo = await context
                .Practitioners.AsNoTracking()
                .Where(p => p.IsActive && (p.IsCareNavigator || p.IsSupportingClinician))
                .Select(p => new
                {
                    p.PractitionerId,
                    p.LastName,
                    Latitude = p
                        .Addresses.Where(a => a.IsPrimary)
                        .Select(a => (double?)a.Address.Latitude)
                        .FirstOrDefault(),
                    Longitude = p
                        .Addresses.Where(a => a.IsPrimary)
                        .Select(a => (double?)a.Address.Longitude)
                        .FirstOrDefault(),
                })
                .ToListAsync(cancellationToken);

            var practitionerIds = staffInfo.Select(p => p.PractitionerId).ToList();

            var shiftLookup = (
                await context
                    .ProviderShifts.AsNoTracking()
                    .Where(s =>
                        practitionerIds.Contains(s.PractitionerId)
                        && s.DayOfWeek == dayOfWeek
                        && s.IsActive
                    )
                    .ToListAsync(cancellationToken)
            )
                .GroupBy(s => s.PractitionerId)
                .ToDictionary(g => g.Key, g => g.ToList());

            var startOfToday = new DateTimeOffset(
                targetDate.Year,
                targetDate.Month,
                targetDate.Day,
                0,
                0,
                0,
                offset
            ).ToUniversalTime();
            var endOfToday = startOfToday.AddDays(1);

            var existingAppointments = await context
                .Appointments.AsNoTracking()
                .Include(a => a.SupportingClinicians)
                .Where(a => a.ScheduledEnd > startOfToday && a.ScheduledStart < endOfToday)
                .Where(a => a.Status != AppointmentStatus.Cancelled && !a.IsDeleted)
                .ToListAsync(cancellationToken);

            var scheduleBlocks = await context
                .ScheduleBlocks.AsNoTracking()
                .Where(b =>
                    b.StartTime >= startOfToday
                    && b.StartTime < endOfToday
                    && b.Status == ScheduleBlockStatus.Blocked
                    && !b.IsDeleted
                )
                .ToListAsync(cancellationToken);

            var allPatientIds = existingAppointments.Select(a => a.PatientId).Distinct().ToList();
            allPatientIds.Add(patientId);

            var patientAddressLookup = (
                await context
                    .EntityAddresses.AsNoTracking()
                    .Where(pa =>
                        pa.PatientId.HasValue
                        && allPatientIds.Contains(pa.PatientId.Value)
                        && pa.IsPrimary
                    )
                    .ToListAsync(cancellationToken)
            )
                .GroupBy(pa => pa.PatientId!.Value)
                .ToDictionary(g => g.Key, g => g.First().Address);

            var practitionerAddressLookup = (
                await context
                    .EntityAddresses.AsNoTracking()
                    .Where(pa =>
                        pa.PractitionerId.HasValue
                        && practitionerIds.Contains(pa.PractitionerId.Value)
                        && pa.IsPrimary
                    )
                    .ToListAsync(cancellationToken)
            )
                .GroupBy(pa => pa.PractitionerId!.Value)
                .ToDictionary(g => g.Key, g => g.First().Address);

            var allSlots = new List<ClinicalSlot>();

            foreach (var staff in staffInfo)
            {
                cancellationToken.ThrowIfCancellationRequested();

                shiftLookup.TryGetValue(staff.PractitionerId, out var shifts);
                if (shifts == null || !shifts.Any())
                {
                    _logger.LogTrace(
                        "Skipping practitioner {Id} - No shifts for {Day}",
                        staff.PractitionerId,
                        dayOfWeek
                    );
                    continue;
                }

                foreach (var shift in shifts)
                {
                    var shiftStart = new DateTimeOffset(targetDate.Add(shift.StartTime), offset);
                    var shiftEnd = new DateTimeOffset(targetDate.Add(shift.EndTime), offset);

                    var effectiveStart =
                        slotWindowStart > shiftStart ? slotWindowStart : shiftStart;
                    var effectiveEnd = slotWindowEnd < shiftEnd ? slotWindowEnd : shiftEnd;

                    if (effectiveStart >= effectiveEnd)
                        continue;

                    var staffAppts = existingAppointments
                        .Where(a =>
                            (
                                a.PractitionerId == staff.PractitionerId
                                || (
                                    a.SupportingClinicians != null
                                    && a.SupportingClinicians.Any(sc =>
                                        sc.PractitionerId == staff.PractitionerId
                                    )
                                )
                            )
                            && (
                                excludeAppointmentId == null
                                || a.AppointmentId != excludeAppointmentId
                            )
                        )
                        .OrderBy(a => a.ScheduledStart)
                        .ToList();

                    int iterations = 0;
                    var searchStart = targetStart; // ALWAYS start searching from the requested time, ignore buckets
                    for (
                        var time = searchStart;
                        time.Add(duration) <= effectiveEnd && iterations < 1000;
                        time = time.AddMinutes(15), iterations++
                    )
                    {
                        if (allSlots.Count % 10 == 0)
                            cancellationToken.ThrowIfCancellationRequested();

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

                        var anchor = staffAppts
                            .Where(a => a.ScheduledEnd <= time)
                            .OrderByDescending(a => a.ScheduledEnd)
                            .FirstOrDefault();

                        Address? startAddr = null;
                        if (anchor == null)
                        {
                            practitionerAddressLookup.TryGetValue(
                                staff.PractitionerId,
                                out startAddr
                            );
                        }
                        else
                        {
                            patientAddressLookup.TryGetValue(anchor.PatientId, out startAddr);
                        }

                        patientAddressLookup.TryGetValue(patientId, out var targetAddr);

                        double distance = 0;
                        double driveTime = 0;

                        bool isInPerson =
                            modality == AppointmentModality.InPersonFacility
                            || modality == AppointmentModality.InPersonHomeVisit;

                        if (
                            isInPerson
                            && startAddr?.Latitude != null
                            && startAddr?.Longitude != null
                            && targetAddr?.Latitude != null
                            && targetAddr?.Longitude != null
                        )
                        {
                            distance = GeoUtils.CalculateDistance(
                                startAddr.Latitude.Value,
                                startAddr.Longitude.Value,
                                targetAddr.Latitude.Value,
                                targetAddr.Longitude.Value
                            );
                            driveTime = GeoUtils.EstimateTravelTimeMinutes(distance);
                        }

                        double effectiveDriveTime = isInPerson ? Math.Max(driveTime, 2) : driveTime;
                        double buffer = isInPerson ? safetyBuffer : TELEHEALTH_BUFFER_MINS;

                        // If no anchor, we assume the staff is starting from home for the day,
                        // but we don't force them to leave at exactly shiftStart if they have no morning visits.
                        var earliestArrival =
                            anchor != null
                                ? anchor.ScheduledEnd.AddMinutes(buffer + effectiveDriveTime)
                                : (
                                    time > shiftStart.AddMinutes(buffer + effectiveDriveTime)
                                        ? time
                                        : shiftStart.AddMinutes(buffer + effectiveDriveTime)
                                );

                        if (time < earliestArrival)
                            continue;

                        var next = staffAppts
                            .Where(a => a.ScheduledStart >= time.Add(duration))
                            .OrderBy(a => a.ScheduledStart)
                            .FirstOrDefault();

                        if (next != null)
                        {
                            double driveToNext = 0;
                            patientAddressLookup.TryGetValue(next.PatientId, out var nextAddr);

                            if (
                                nextAddr?.Latitude != null
                                && nextAddr?.Longitude != null
                                && targetAddr?.Latitude != null
                                && targetAddr?.Longitude != null
                            )
                            {
                                var distToNext = GeoUtils.CalculateDistance(
                                    targetAddr.Latitude.Value,
                                    targetAddr.Longitude.Value,
                                    nextAddr.Latitude.Value,
                                    nextAddr.Longitude.Value
                                );
                                driveToNext = GeoUtils.EstimateTravelTimeMinutes(distToNext);
                            }

                            bool nextIsInPerson =
                                next.Modality == AppointmentModality.InPersonFacility
                                || next.Modality == AppointmentModality.InPersonHomeVisit;
                            double nextBuffer = nextIsInPerson
                                ? safetyBuffer
                                : TELEHEALTH_BUFFER_MINS;

                            double effectiveDriveToNext = nextIsInPerson
                                ? Math.Max(driveToNext, 2)
                                : driveToNext;
                            if (
                                time.Add(duration).AddMinutes(effectiveDriveToNext + nextBuffer)
                                > next.ScheduledStart
                            )
                                continue;
                        }

                        var appointmentEnd = time.Add(duration);
                        double returnDistance = 0;

                        practitionerAddressLookup.TryGetValue(
                            staff.PractitionerId,
                            out var staffHomeAddr
                        );

                        if (
                            staffHomeAddr?.Latitude != null
                            && staffHomeAddr?.Longitude != null
                            && targetAddr?.Latitude != null
                            && targetAddr?.Longitude != null
                        )
                        {
                            returnDistance = GeoUtils.CalculateDistance(
                                targetAddr.Latitude.Value,
                                targetAddr.Longitude.Value,
                                staffHomeAddr.Latitude.Value,
                                staffHomeAddr.Longitude.Value
                            );
                        }
                        double returnTravelTime = GeoUtils.EstimateTravelTimeMinutes(
                            returnDistance
                        );
                        double effectiveReturnTime = isInPerson
                            ? Math.Max(returnTravelTime, 2)
                            : returnTravelTime;

                        if (appointmentEnd.AddMinutes(effectiveReturnTime) > shiftEnd)
                            continue;

                        allSlots.Add(
                            new ClinicalSlot
                            {
                                PractitionerId = staff.PractitionerId,
                                StartTime = time,
                                EndTime = time.Add(duration),
                                DistanceInMiles = Math.Round(distance, 2),
                                TravelTimeInMinutes = Math.Round(effectiveDriveTime, 0),
                                BufferTimeInMinutes = Math.Round(buffer, 0),
                            }
                        );
                    }
                }
            }

            return allSlots.OrderBy(s => s.StartTime).ThenBy(s => s.TravelTimeInMinutes).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, ">>> GEOSPATIAL RADAR ERROR: {Message}", ex.Message);
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
        using var context = await _dbFactory.CreateDbContextAsync(cancellationToken);
        var settings = await context.TenantConfigurations.FirstOrDefaultAsync(cancellationToken);
        var safetyBuffer = settings?.EngineSafetyDriveMins ?? FALLBACK_IN_PERSON_BUFFER;

        var appt = await context
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

        var startOfDay = new DateTimeOffset(appt.ScheduledStart.Date, TimeSpan.Zero);
        var prevAppt = await context
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
                var practitioner = await context
                    .Practitioners.Include(p => p.Addresses)
                        .ThenInclude(a => a.Address)
                    .FirstOrDefaultAsync(
                        p => p.PractitionerId == appt.PractitionerId,
                        cancellationToken
                    );
                var home = practitioner?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
                startLat = home?.Latitude ?? 14.6760;
                startLon = home?.Longitude ?? 121.0437;
            }
        }
        else
        {
            var practitioner = await context
                .Practitioners.Include(p => p.Addresses)
                    .ThenInclude(a => a.Address)
                .FirstOrDefaultAsync(
                    p => p.PractitionerId == appt.PractitionerId,
                    cancellationToken
                );
            var home = practitioner?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
            startLat = home?.Latitude ?? 14.6760;
            startLon = home?.Longitude ?? 121.0437;
        }

        double distance = GeoUtils.CalculateDistance(
            startLat,
            startLon,
            patientAddr.Latitude.Value,
            patientAddr.Longitude.Value
        );

        bool isInPerson =
            appt.Modality == AppointmentModality.InPersonFacility
            || appt.Modality == AppointmentModality.InPersonHomeVisit;
        double buffer = isInPerson ? safetyBuffer : TELEHEALTH_BUFFER_MINS;
        double driveTime = GeoUtils.EstimateTravelTimeMinutes(distance);
        double effectiveDriveTime = isInPerson ? Math.Max(driveTime, 2) : driveTime;
        double travelTime = buffer + effectiveDriveTime;

        return (Math.Round(distance, 2), Math.Round(effectiveDriveTime, 0));
    }

    public async Task<(bool isValid, string? reason)> ValidateLogisticsAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default
    )
    {
        using var context = await _dbFactory.CreateDbContextAsync(cancellationToken);
        var settings = await context.TenantConfigurations.FirstOrDefaultAsync(cancellationToken);
        var safetyBuffer = settings?.EngineSafetyDriveMins ?? FALLBACK_IN_PERSON_BUFFER;

        var appt = await context
            .Appointments.Include(a => a.Patient)
                .ThenInclude(p => p.Addresses)
                    .ThenInclude(a => a.Address)
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId, cancellationToken);

        if (appt == null)
            return (false, "Appointment not found");

        var startOfDay = new DateTimeOffset(appt.ScheduledStart.Date, TimeSpan.Zero);
        var endOfDay = startOfDay.AddDays(1);

        var dayAppts = await context
            .Appointments.Include(a => a.Patient)
                .ThenInclude(p => p.Addresses)
                    .ThenInclude(a => a.Address)
            .Where(a =>
                a.PractitionerId == appt.PractitionerId
                && a.ScheduledStart >= startOfDay
                && a.ScheduledStart < endOfDay
                && a.AppointmentId != appt.AppointmentId
            )
            .OrderBy(a => a.ScheduledStart)
            .ToListAsync(cancellationToken);

        var patientAddr = appt.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
        bool isInPerson =
            appt.Modality == AppointmentModality.InPersonFacility
            || appt.Modality == AppointmentModality.InPersonHomeVisit;
        double buffer = isInPerson ? safetyBuffer : TELEHEALTH_BUFFER_MINS;

        var prev = dayAppts.Where(a => a.ScheduledStart < appt.ScheduledStart).LastOrDefault();
        if (prev != null)
        {
            double driveTime = 0;
            var prevAddr = prev.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
            if (
                prevAddr?.Latitude.HasValue == true
                && prevAddr?.Longitude.HasValue == true
                && patientAddr?.Latitude.HasValue == true
            )
            {
                var dist = GeoUtils.CalculateDistance(
                    prevAddr.Latitude.Value,
                    prevAddr.Longitude.Value,
                    patientAddr.Latitude.Value,
                    patientAddr.Longitude.Value
                );
                driveTime = GeoUtils.EstimateTravelTimeMinutes(dist);
            }

            double effectiveDriveTime = isInPerson ? Math.Max(driveTime, 2) : driveTime;
            double totalLogisticsTime = buffer + effectiveDriveTime;

            if (appt.ScheduledStart < prev.ScheduledEnd.AddMinutes(totalLogisticsTime))
            {
                return (
                    false,
                    $"Logistics Violation: Insufficient time for drive ({Math.Round(effectiveDriveTime)}m) and buffer ({buffer}m) from previous visit."
                );
            }
        }

        var next = dayAppts.Where(a => a.ScheduledStart > appt.ScheduledStart).FirstOrDefault();
        if (next != null)
        {
            double driveToNext = 0;
            var nextAddr = next.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
            if (
                nextAddr?.Latitude.HasValue == true
                && nextAddr?.Longitude.HasValue == true
                && patientAddr?.Latitude.HasValue == true
            )
            {
                var dist = GeoUtils.CalculateDistance(
                    patientAddr.Latitude.Value,
                    patientAddr.Longitude.Value,
                    nextAddr.Latitude.Value,
                    nextAddr.Longitude.Value
                );
                driveToNext = GeoUtils.EstimateTravelTimeMinutes(dist);
            }

            bool nextIsInPerson =
                next.Modality == AppointmentModality.InPersonFacility
                || next.Modality == AppointmentModality.InPersonHomeVisit;
            double nextBuffer = nextIsInPerson ? safetyBuffer : TELEHEALTH_BUFFER_MINS;

            double effectiveDriveToNext = nextIsInPerson ? Math.Max(driveToNext, 2) : driveToNext;

            if (
                appt.ScheduledEnd.AddMinutes(effectiveDriveToNext + nextBuffer)
                > next.ScheduledStart
            )
            {
                return (
                    false,
                    $"Logistics Violation: This slot would prevent arriving on time for the next visit (requires {Math.Round(effectiveDriveToNext)}m drive + {nextBuffer}m buffer)."
                );
            }
        }

        return (true, null);
    }

    public async Task<List<Application.Appointments.Dtos.ReassignmentProviderDto>> GetAvailableProvidersForReassignmentAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default
    )
    {
        using var context = await _dbFactory.CreateDbContextAsync(cancellationToken);

        var appointment = await context
            .Appointments.AsNoTracking()
            .Include(a => a.Patient)
                .ThenInclude(p => p.Addresses)
                    .ThenInclude(addr => addr.Address)
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId, cancellationToken);

        if (appointment == null)
            return new List<Application.Appointments.Dtos.ReassignmentProviderDto>();

        var start = appointment.ScheduledStart;
        var end = appointment.ScheduledEnd;
        var patientAddr = appointment.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;

        var candidates = await context
            .Practitioners.AsNoTracking()
            .Where(p => p.IsActive)
            .Where(p =>
                !context.Appointments.Any(a =>
                    a.PractitionerId == p.PractitionerId
                    && a.Status != AppointmentStatus.Cancelled
                    && !a.IsDeleted
                    && a.ScheduledStart < end
                    && a.ScheduledEnd > start
                )
            )
            .Where(p =>
                !context.ScheduleBlocks.Any(b =>
                    b.PractitionerId == p.PractitionerId
                    && b.Status == ScheduleBlockStatus.Blocked
                    && !b.IsDeleted
                    && b.StartTime < end
                    && b.EndTime > start
                )
            )
            .ToListAsync(cancellationToken);

        var available = new List<Application.Appointments.Dtos.ReassignmentProviderDto>();
        foreach (var p in candidates)
        {
            if (
                await _travelService.ValidateTravelBufferAsync(
                    p.PractitionerId,
                    appointmentId,
                    cancellationToken
                )
            )
            {
                double? distance = null;
                double? driveTime = null;

                // Calculate distance from previous appointment on the same day
                var dayAppts = await context.Appointments
                    .AsNoTracking()
                    .Include(a => a.Patient)
                        .ThenInclude(pat => pat.Addresses)
                            .ThenInclude(addr => addr.Address)
                    .Where(a => a.PractitionerId == p.PractitionerId && 
                               a.ScheduledStart.Date == appointment.ScheduledStart.Date &&
                               a.Status != AppointmentStatus.Cancelled &&
                               !a.IsDeleted)
                    .OrderBy(a => a.ScheduledStart)
                    .ToListAsync(cancellationToken);

                var prev = dayAppts.LastOrDefault(a => a.ScheduledStart < start);
                if (prev != null && patientAddr?.Latitude.HasValue == true && patientAddr?.Longitude.HasValue == true)
                {
                    var prevAddr = prev.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
                    if (prevAddr?.Latitude.HasValue == true && prevAddr?.Longitude.HasValue == true)
                    {
                        distance = GeoUtils.CalculateDistance(
                            prevAddr.Latitude.Value,
                            prevAddr.Longitude.Value,
                            patientAddr.Latitude.Value,
                            patientAddr.Longitude.Value
                        );
                        driveTime = GeoUtils.EstimateTravelTimeMinutes(distance.Value);
                    }
                }

                available.Add(new Application.Appointments.Dtos.ReassignmentProviderDto
                {
                    PractitionerId = p.PractitionerId,
                    FullName = p.FullName,
                    TravelTimeMinutes = driveTime,
                    DistanceInMiles = distance,
                    IsCareNavigator = p.IsCareNavigator,
                    IsSupportingClinician = p.IsSupportingClinician,
                    Position = p.Position.ToString()
                });
            }
        }

        return available;
    }
}
