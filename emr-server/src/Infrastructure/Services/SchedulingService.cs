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
    private static readonly SemaphoreSlim _semaphore = new(10);

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

    private static bool IsInPerson(AppointmentModality modality) =>
        modality == AppointmentModality.InPersonFacility
        || modality == AppointmentModality.InPersonHomeVisit;

    public async Task<List<ClinicalSlot>> GetAvailableProvidersAsync(
        DateTimeOffset targetStart,
        TimeSpan duration,
        AppointmentModality modality,
        Guid patientId,
        Guid? excludeAppointmentId = null,
        CancellationToken cancellationToken = default
    )
    {
        _logger.LogInformation(">>> GEOSPATIAL RADAR: Scanning availability for Patient/Lead {Id} at {Time}", patientId, targetStart);
        try
        {
            await _semaphore.WaitAsync(cancellationToken);

            using var context = await _dbFactory.CreateDbContextAsync(cancellationToken);
            var settings = await context
                .TenantConfigurations.AsNoTracking()
                .OrderBy(c => c.TenantConfigurationId)
                .FirstOrDefaultAsync(cancellationToken);

            var amStart = settings?.AmStartHour ?? 8;
            var pmStart = settings?.PmStartHour ?? 13;
            var dayEnd = settings?.DayEndHour ?? 18;
            var safetyBuffer = settings?.EngineSafetyDriveMins ?? FALLBACK_IN_PERSON_BUFFER;

            TimeZoneInfo tzi;
            try
            {
                tzi = TimeZoneInfo.FindSystemTimeZoneById(settings?.Timezone ?? TimeZoneInfo.Local.Id);
            }
            catch
            {
                tzi = TimeZoneInfo.Local;
            }

            var targetInTz = TimeZoneInfo.ConvertTime(targetStart, tzi);
            var offset = targetInTz.Offset;
            var targetDate = targetInTz.Date;
            var dayOfWeek = targetDate.DayOfWeek;

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

            var staffInfo = await context
                .Practitioners.AsNoTracking()
                .Where(p => p.IsActive && (p.IsCareNavigator || p.IsSupportingClinician))
                .Select(p => new { p.PractitionerId, p.LastName })
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
            );
            var endOfToday = startOfToday.AddDays(1);

            var existingAppointments = await context
                .Appointments.AsNoTracking()
                .Include(a => a.SupportingClinicians)
                .Where(a => a.ScheduledEnd > startOfToday && a.ScheduledStart < endOfToday)
                .Where(a => a.Status != AppointmentStatus.Cancelled && !a.IsDeleted)
                .Where(a =>
                    (a.PractitionerId.HasValue && practitionerIds.Contains(a.PractitionerId.Value))
                    || a.SupportingClinicians.Any(sc => practitionerIds.Contains(sc.PractitionerId))
                )
                .ToListAsync(cancellationToken);

            var scheduleBlocks = await context
                .ScheduleBlocks.AsNoTracking()
                .Where(b =>
                    b.EndTime > startOfToday
                    && b.StartTime < endOfToday
                    && b.Status == ScheduleBlockStatus.Blocked
                    && !b.IsDeleted
                    && practitionerIds.Contains(b.PractitionerId)
                )
                .ToListAsync(cancellationToken);

            var allPatientIds = existingAppointments.Select(a => a.PatientId).Distinct().ToList();
            allPatientIds.Add(patientId);

            var patientAddressLookup = (
                await context
                    .EntityAddresses.AsNoTracking()
                    .Include(pa => pa.Address)
                    .Where(pa =>
                        pa.PatientId.HasValue
                        && allPatientIds.Contains(pa.PatientId.Value)
                        && pa.IsPrimary
                    )
                    .ToListAsync(cancellationToken)
            )
                .GroupBy(pa => pa.PatientId!.Value)
                .ToDictionary(g => g.Key, g => g.First().Address);

            // Outreach Lead Support: If patient address not found OR has no coordinates, check Outreach table
            if (!patientAddressLookup.TryGetValue(patientId, out var existingAddr) || existingAddr?.Latitude == null)
            {
                var lead = await context.PatientOutreaches
                    .AsNoTracking()
                    .FirstOrDefaultAsync(o => o.PatientOutreachId == patientId, cancellationToken);
                
                if (lead?.MailingAddress != null && lead.MailingAddress.Latitude != null)
                {
                    patientAddressLookup[patientId] = lead.MailingAddress;
                    _logger.LogInformation(">>> GEOSPATIAL RADAR: Using address from Outreach Lead {Id}", patientId);
                }
                else
                {
                    // Temporal Fallback for Testing (Cebu City)
                    _logger.LogWarning(">>> GEOSPATIAL RADAR: Falling back to Temporal Default Address (Osmeña Blvd) for Lead {Id}", patientId);
                    patientAddressLookup[patientId] = new Address
                    {
                        Street = "Osmeña Blvd",
                        City = "Cebu City",
                        State = "Cebu",
                        PostalCode = "6000",
                        Latitude = 10.3121,
                        Longitude = 123.8966
                    };
                }
            }

            var practitionerAddressLookup = (
                await context
                    .EntityAddresses.AsNoTracking()
                    .Include(pa => pa.Address)
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
            bool targetIsInPerson = IsInPerson(modality);
            patientAddressLookup.TryGetValue(patientId, out var targetAddr);

            foreach (var staff in staffInfo)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (!shiftLookup.TryGetValue(staff.PractitionerId, out var shifts) || !shifts.Any())
                {
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

                    var staffBlocks = scheduleBlocks
                        .Where(b => b.PractitionerId == staff.PractitionerId)
                        .ToList();

                    // Pre-calculate travel coordinates cache to optimize tightness of the slot generator loop
                    var travelCache = new Dictionary<string, (double distance, double driveTime)>();
                    if (targetIsInPerson)
                    {
                        practitionerAddressLookup.TryGetValue(staff.PractitionerId, out var homeAddr);
                        
                        // 1. Home -> Target
                        if (homeAddr?.Latitude != null && homeAddr?.Longitude != null && targetAddr?.Latitude != null && targetAddr?.Longitude != null)
                        {
                            var (d, t) = await _travelService.GetDistanceAndDurationAsync(
                                homeAddr.Latitude.Value,
                                homeAddr.Longitude.Value,
                                targetAddr.Latitude.Value,
                                targetAddr.Longitude.Value,
                                cancellationToken
                            );
                            travelCache["home_to_target"] = (d, t);
                        }
                        else
                        {
                            travelCache["home_to_target"] = (0.0, 2.0);
                        }

                        // 2. Target -> Home
                        if (homeAddr?.Latitude != null && homeAddr?.Longitude != null && targetAddr?.Latitude != null && targetAddr?.Longitude != null)
                        {
                            var (d, t) = await _travelService.GetDistanceAndDurationAsync(
                                targetAddr.Latitude.Value,
                                targetAddr.Longitude.Value,
                                homeAddr.Latitude.Value,
                                homeAddr.Longitude.Value,
                                cancellationToken
                            );
                            travelCache["target_to_home"] = (d, t);
                        }
                        else
                        {
                            travelCache["target_to_home"] = (0.0, 2.0);
                        }

                        // 3. Appt -> Target & Target -> Appt
                        foreach (var appt in staffAppts)
                        {
                            if (IsInPerson(appt.Modality))
                            {
                                patientAddressLookup.TryGetValue(appt.PatientId, out var apptAddr);
                                if (apptAddr?.Latitude != null && apptAddr?.Longitude != null && targetAddr?.Latitude != null && targetAddr?.Longitude != null)
                                {
                                    var (d1, t1) = await _travelService.GetDistanceAndDurationAsync(
                                        apptAddr.Latitude.Value,
                                        apptAddr.Longitude.Value,
                                        targetAddr.Latitude.Value,
                                        targetAddr.Longitude.Value,
                                        cancellationToken
                                    );
                                    travelCache[$"from_{appt.AppointmentId}"] = (d1, t1);

                                    var (d2, t2) = await _travelService.GetDistanceAndDurationAsync(
                                        targetAddr.Latitude.Value,
                                        targetAddr.Longitude.Value,
                                        apptAddr.Latitude.Value,
                                        apptAddr.Longitude.Value,
                                        cancellationToken
                                    );
                                    travelCache[$"to_{appt.AppointmentId}"] = (d2, t2);
                                }
                            }
                        }
                    }

                    int iterations = 0;
                    var loopStart = targetStart > effectiveStart ? targetStart : effectiveStart;
                    for (
                        var time = loopStart;
                        time.Add(duration) <= effectiveEnd && iterations < 1000;
                        time = time.AddMinutes(5), iterations++
                    )
                    {
                        if (iterations % 10 == 0)
                            cancellationToken.ThrowIfCancellationRequested();

                        var conflictingAppt = staffAppts.FirstOrDefault(a =>
                            time < a.ScheduledEnd && time.Add(duration) > a.ScheduledStart
                        );
                        if (conflictingAppt != null)
                        {
                            time = GeoUtils.CeilToNearestMinutes(conflictingAppt.ScheduledEnd, 5).AddMinutes(-5);
                            continue;
                        }

                        var conflictingBlock = staffBlocks.FirstOrDefault(b =>
                            time < b.EndTime && time.Add(duration) > b.StartTime
                        );
                        if (conflictingBlock != null)
                        {
                            time = GeoUtils.CeilToNearestMinutes(conflictingBlock.EndTime, 5).AddMinutes(-5);
                            continue;
                        }

                        var prevAppts = staffAppts
                            .Where(a => a.ScheduledEnd <= time)
                            .OrderByDescending(a => a.ScheduledEnd)
                            .ToList();
                        var prev = prevAppts.FirstOrDefault();

                        double distance = 0;
                        double driveTime = 0;
                        double buffer = targetIsInPerson ? safetyBuffer : TELEHEALTH_BUFFER_MINS;

                        if (targetIsInPerson)
                        {
                            var lastInPerson = prevAppts.FirstOrDefault(a =>
                                IsInPerson(a.Modality)
                            );
                            if (lastInPerson != null)
                            {
                                if (travelCache.TryGetValue($"from_{lastInPerson.AppointmentId}", out var cachedVal))
                                {
                                    distance = cachedVal.distance;
                                    driveTime = cachedVal.driveTime;
                                }
                            }
                            else
                            {
                                if (travelCache.TryGetValue("home_to_target", out var cachedVal))
                                {
                                    distance = cachedVal.distance;
                                    driveTime = cachedVal.driveTime;
                                }
                                else
                                {
                                    driveTime = 2.0;
                                }
                            }
                        }

                        double effectiveDriveTime = targetIsInPerson ? Math.Max(driveTime, 2) : 0;

                        DateTimeOffset earliestArrival =
                            prev != null
                                ? prev.ScheduledEnd.AddMinutes(buffer + effectiveDriveTime)
                                : (
                                    time > shiftStart.AddMinutes(buffer + effectiveDriveTime)
                                        ? time
                                        : shiftStart.AddMinutes(buffer + effectiveDriveTime)
                                );

                        earliestArrival = GeoUtils.CeilToNearestMinutes(earliestArrival, 5);

                        if (time < earliestArrival)
                        {
                            time = earliestArrival.AddMinutes(-5);
                            continue;
                        }

                        var next = staffAppts.FirstOrDefault(a =>
                            a.ScheduledStart >= time.Add(duration)
                        );
                        if (next != null)
                        {
                            double driveToNext = 0;
                            bool nextIsInPerson = IsInPerson(next.Modality);

                            if (nextIsInPerson)
                            {
                                patientAddressLookup.TryGetValue(next.PatientId, out var nextAddr);

                                Address? originAddr = targetAddr;
                                double? cachedDriveToNext = null;

                                if (targetIsInPerson)
                                {
                                    if (travelCache.TryGetValue($"to_{next.AppointmentId}", out var cachedVal))
                                    {
                                        driveToNext = cachedVal.driveTime;
                                        cachedDriveToNext = driveToNext;
                                    }
                                }
                                else
                                {
                                    var lastInPerson = prevAppts.FirstOrDefault(a =>
                                        IsInPerson(a.Modality)
                                    );
                                    if (lastInPerson != null)
                                    {
                                        patientAddressLookup.TryGetValue(
                                            lastInPerson.PatientId,
                                            out originAddr
                                        );
                                    }
                                    else
                                    {
                                        practitionerAddressLookup.TryGetValue(
                                            staff.PractitionerId,
                                            out originAddr
                                        );
                                    }
                                }

                                if (cachedDriveToNext == null)
                                {
                                    if (
                                        originAddr?.Latitude != null
                                        && originAddr?.Longitude != null
                                        && nextAddr?.Latitude != null
                                        && nextAddr?.Longitude != null
                                    )
                                    {
                                        var distToNext = GeoUtils.CalculateDistance(
                                            originAddr.Latitude.Value,
                                            originAddr.Longitude.Value,
                                            nextAddr.Latitude.Value,
                                            nextAddr.Longitude.Value
                                        );
                                        driveToNext = GeoUtils.EstimateTravelTimeMinutes(distToNext);
                                    }
                                }
                            }

                            double nextBuffer = nextIsInPerson
                                ? safetyBuffer
                                : TELEHEALTH_BUFFER_MINS;
                            double effectiveDriveToNext = nextIsInPerson
                                ? Math.Max(driveToNext, 2)
                                : 0;

                            if (
                                time.Add(duration).AddMinutes(effectiveDriveToNext + nextBuffer)
                                > next.ScheduledStart
                            )
                                continue;
                        }

                        var appointmentEnd = time.Add(duration);
                        double returnTravelTime = 0;

                        if (targetIsInPerson)
                        {
                            if (travelCache.TryGetValue("target_to_home", out var cachedVal))
                            {
                                returnTravelTime = cachedVal.driveTime;
                            }
                            else
                            {
                                returnTravelTime = 2.0;
                            }
                        }

                        double effectiveReturnTime = targetIsInPerson
                            ? Math.Max(returnTravelTime, 2)
                            : 0;

                        if (appointmentEnd.AddMinutes(effectiveReturnTime) > shiftEnd)
                            continue;

                        allSlots.Add(
                            new ClinicalSlot
                            {
                                PractitionerId = staff.PractitionerId,
                                StartTime = time,
                                EndTime = appointmentEnd,
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
        Appointment appointment,
        CancellationToken cancellationToken = default
    )
    {
        await _semaphore.WaitAsync(cancellationToken);
        try
        {
            using var context = await _dbFactory.CreateDbContextAsync(cancellationToken);
            var settings = await context
                .TenantConfigurations.AsNoTracking()
                .OrderBy(c => c.TenantConfigurationId)
                .FirstOrDefaultAsync(cancellationToken);
            var safetyBuffer = settings?.EngineSafetyDriveMins ?? FALLBACK_IN_PERSON_BUFFER;

            // Use the passed entity's data to avoid stale reads from the DB during transactions
            var appt = appointment;

            if (appt == null)
                return (0, 0);

            TimeZoneInfo tzi;
            try { tzi = TimeZoneInfo.FindSystemTimeZoneById(settings?.Timezone ?? TimeZoneInfo.Local.Id); }
            catch { tzi = TimeZoneInfo.Local; }

            var targetInTz = TimeZoneInfo.ConvertTime(appt.ScheduledStart, tzi);
            var offset = targetInTz.Offset;
            var targetDate = targetInTz.Date;

            if (!IsInPerson(appt.Modality))
                return (0, 0);

            // Fetch patient/address only if not already hydrated in the entity
            var patient = appt.Patient;
            if (patient == null || !patient.Addresses.Any())
            {
                patient = await context
                    .Patients.AsNoTracking()
                    .Include(p => p.Addresses)
                        .ThenInclude(a => a.Address)
                    .FirstOrDefaultAsync(p => p.PatientId == appt.PatientId, cancellationToken);
            }

            var patientAddr = patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
            if (patientAddr?.Latitude == null || patientAddr?.Longitude == null)
                return (0, 0);

            var startOfDay = new DateTimeOffset(targetDate, offset);

            var prevAppts = await context
                .Appointments.AsNoTracking()
                .Include(a => a.Patient)
                    .ThenInclude(p => p.Addresses)
                        .ThenInclude(a => a.Address)
                .Where(a =>
                    a.PractitionerId == appt.PractitionerId
                    && a.ScheduledStart < appt.ScheduledStart
                    && a.ScheduledStart >= startOfDay
                    && a.AppointmentId != appt.AppointmentId
                    && a.Status != AppointmentStatus.Cancelled
                    && !a.IsDeleted
                )
                .OrderByDescending(a => a.ScheduledStart)
                .ToListAsync(cancellationToken);

            var lastInPersonAppt = prevAppts.FirstOrDefault(a => IsInPerson(a.Modality));

            double? startLat = null;
            double? startLon = null;

            if (lastInPersonAppt != null)
            {
                var prevAddr = lastInPersonAppt
                    .Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)
                    ?.Address;
                startLat = prevAddr?.Latitude;
                startLon = prevAddr?.Longitude;
            }

            if (startLat == null || startLon == null)
            {
                var practitioner = await context
                    .Practitioners.AsNoTracking()
                    .Include(p => p.Addresses)
                        .ThenInclude(a => a.Address)
                    .FirstOrDefaultAsync(
                        p => p.PractitionerId == appt.PractitionerId,
                        cancellationToken
                    );
                var home = practitioner?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;

                startLat = home?.Latitude;
                startLon = home?.Longitude;
            }

            if (startLat == null || startLon == null)
                return (0, 0);

            var (distance, driveTime) = await _travelService.GetDistanceAndDurationAsync(
                startLat.Value,
                startLon.Value,
                patientAddr.Latitude.Value,
                patientAddr.Longitude.Value,
                cancellationToken
            );
            double effectiveDriveTime = Math.Max(driveTime, 2);

            return (Math.Round(distance, 2), Math.Round(effectiveDriveTime, 0));
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<(bool isValid, string? reason)> ValidateLogisticsAsync(
        Appointment appointment,
        CancellationToken cancellationToken = default
    )
    {
        await _semaphore.WaitAsync(cancellationToken);
        try
        {
            using var context = await _dbFactory.CreateDbContextAsync(cancellationToken);
            var settings = await context
                .TenantConfigurations.AsNoTracking()
                .OrderBy(c => c.TenantConfigurationId)
                .FirstOrDefaultAsync(cancellationToken);
            var safetyBuffer = settings?.EngineSafetyDriveMins ?? FALLBACK_IN_PERSON_BUFFER;

            // Use the passed entity's data to avoid stale reads from the DB during transactions
            var appt = appointment;

            if (appt == null)
                return (false, "Appointment not found");

            TimeZoneInfo tzi;
            try
            {
                tzi = TimeZoneInfo.FindSystemTimeZoneById(settings?.Timezone ?? TimeZoneInfo.Local.Id);
            }
            catch
            {
                tzi = TimeZoneInfo.Local;
            }

            var targetInTz = TimeZoneInfo.ConvertTime(appt.ScheduledStart, tzi);
            var offset = targetInTz.Offset;
            var targetDate = targetInTz.Date;

            var startOfDay = new DateTimeOffset(targetDate, offset);
            var endOfDay = startOfDay.AddDays(1);

            var dayAppts = await context
                .Appointments.AsNoTracking()
                .Include(a => a.Patient)
                    .ThenInclude(p => p.Addresses)
                        .ThenInclude(a => a.Address)
                .Where(a =>
                    a.PractitionerId == appt.PractitionerId
                    && a.ScheduledStart >= startOfDay
                    && a.ScheduledStart < endOfDay
                    && a.AppointmentId != appt.AppointmentId
                    && a.Status != AppointmentStatus.Cancelled
                    && !a.IsDeleted
                )
                .OrderBy(a => a.ScheduledStart)
                .ToListAsync(cancellationToken);

            // Fetch patient/address only if not already hydrated in the entity
            var patient = appt.Patient;
            if (patient == null || !patient.Addresses.Any())
            {
                patient = await context
                    .Patients.AsNoTracking()
                    .Include(p => p.Addresses)
                        .ThenInclude(a => a.Address)
                    .FirstOrDefaultAsync(p => p.PatientId == appt.PatientId, cancellationToken);
            }

            var patientAddr = patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
            bool isTargetInPerson = IsInPerson(appt.Modality);
            double buffer = isTargetInPerson ? safetyBuffer : TELEHEALTH_BUFFER_MINS;

            var practitioner = await context
                .Practitioners.AsNoTracking()
                .Include(p => p.Addresses)
                    .ThenInclude(a => a.Address)
                .FirstOrDefaultAsync(
                    p => p.PractitionerId == appt.PractitionerId,
                    cancellationToken
                );
            var practitionerHomeAddr = practitioner
                ?.Addresses.FirstOrDefault(a => a.IsPrimary)
                ?.Address;

            var prevAppts = dayAppts
                .Where(a => a.ScheduledStart < appt.ScheduledStart)
                .OrderByDescending(a => a.ScheduledEnd)
                .ToList();
            var prev = prevAppts.FirstOrDefault();

            if (prev != null)
            {
                double driveTime = 0;

                if (isTargetInPerson)
                {
                    var lastInPerson = prevAppts.FirstOrDefault(a => IsInPerson(a.Modality));
                    var prevAddr = lastInPerson
                        ?.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)
                        ?.Address;

                    if (
                        prevAddr?.Latitude.HasValue == true
                        && prevAddr?.Longitude.HasValue == true
                        && patientAddr?.Latitude.HasValue == true
                        && patientAddr?.Longitude.HasValue == true
                    )
                    {
                        var (dist, t) = await _travelService.GetDistanceAndDurationAsync(
                            prevAddr.Latitude.Value,
                            prevAddr.Longitude.Value,
                            patientAddr.Latitude.Value,
                            patientAddr.Longitude.Value,
                            cancellationToken
                        );
                        driveTime = t;
                    }
                    else if (lastInPerson == null)
                    {
                        var homeAddr = practitionerHomeAddr;

                        if (
                            homeAddr?.Latitude.HasValue == true
                            && homeAddr?.Longitude.HasValue == true
                            && patientAddr?.Latitude.HasValue == true
                            && patientAddr?.Longitude.HasValue == true
                        )
                        {
                            var (dist, t) = await _travelService.GetDistanceAndDurationAsync(
                                homeAddr.Latitude.Value,
                                homeAddr.Longitude.Value,
                                patientAddr.Latitude.Value,
                                patientAddr.Longitude.Value,
                                cancellationToken
                            );
                            driveTime = t;
                        }
                    }
                }

                double effectiveDriveTime = isTargetInPerson ? Math.Max(driveTime, 2) : 0;
                double totalLogisticsTime = buffer + effectiveDriveTime;

                var requiredStart = prev.ScheduledEnd.AddMinutes(totalLogisticsTime);
                requiredStart = GeoUtils.CeilToNearestMinutes(requiredStart, 5);

                if (appt.ScheduledStart < requiredStart)
                {
                    return (
                        false,
                        $"Logistics Violation: Insufficient time for drive ({Math.Round(effectiveDriveTime)}m) and buffer ({buffer}m) from previous visit."
                    );
                }
            }

            var nextAppts = dayAppts
                .Where(a => a.ScheduledStart >= appt.ScheduledEnd)
                .OrderBy(a => a.ScheduledStart)
                .ToList();
            var next = nextAppts.FirstOrDefault();

            if (next != null)
            {
                double driveToNext = 0;
                bool nextIsInPerson = IsInPerson(next.Modality);

                if (nextIsInPerson)
                {
                    var nextAddr = next
                        .Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)
                        ?.Address;

                    if (isTargetInPerson)
                    {
                        if (
                            nextAddr?.Latitude.HasValue == true
                            && nextAddr?.Longitude.HasValue == true
                            && patientAddr?.Latitude.HasValue == true
                            && patientAddr?.Longitude.HasValue == true
                        )
                        {
                            var (dist, t) = await _travelService.GetDistanceAndDurationAsync(
                                patientAddr.Latitude.Value,
                                patientAddr.Longitude.Value,
                                nextAddr.Latitude.Value,
                                nextAddr.Longitude.Value,
                                cancellationToken
                            );
                            driveToNext = t;
                        }
                    }
                    else
                    {
                        var lastInPerson = prevAppts.FirstOrDefault(a => IsInPerson(a.Modality));
                        Address? originAddr = null;

                        if (lastInPerson != null)
                        {
                            originAddr = lastInPerson
                                .Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)
                                ?.Address;
                        }
                        else
                        {
                            originAddr = practitionerHomeAddr;
                        }

                        if (
                            originAddr?.Latitude.HasValue == true
                            && originAddr?.Longitude.HasValue == true
                            && nextAddr?.Latitude.HasValue == true
                            && nextAddr?.Longitude.HasValue == true
                        )
                        {
                            var (dist, t) = await _travelService.GetDistanceAndDurationAsync(
                                originAddr.Latitude.Value,
                                originAddr.Longitude.Value,
                                nextAddr.Latitude.Value,
                                nextAddr.Longitude.Value,
                                cancellationToken
                            );
                            driveToNext = t;
                        }
                    }
                }

                double nextBuffer = nextIsInPerson ? safetyBuffer : TELEHEALTH_BUFFER_MINS;
                double effectiveDriveToNext = nextIsInPerson ? Math.Max(driveToNext, 2) : 0;

                var requiredArrival = appt.ScheduledEnd.AddMinutes(
                    effectiveDriveToNext + nextBuffer
                );
                requiredArrival = GeoUtils.CeilToNearestMinutes(requiredArrival, 5);

                if (requiredArrival > next.ScheduledStart)
                {
                    return (
                        false,
                        $"Logistics Violation: This slot would prevent arriving on time for the next visit (requires {Math.Round(effectiveDriveToNext)}m drive + {nextBuffer}m buffer)."
                    );
                }
            }

            // --- SHIFT END VALIDATION: Ensure return to home fits within shift ---
            var shift = await context
                .ProviderShifts.AsNoTracking()
                .Where(s =>
                    s.PractitionerId == appt.PractitionerId
                    && s.DayOfWeek == targetDate.DayOfWeek
                    && s.IsActive
                )
                .FirstOrDefaultAsync(cancellationToken);

            if (shift != null)
            {
                var shiftEnd = new DateTimeOffset(
                    targetDate.Add(shift.EndTime),
                    offset
                );
                double returnTravelTime = 0;

                if (isTargetInPerson 
                    && practitionerHomeAddr?.Latitude != null 
                    && practitionerHomeAddr?.Longitude != null 
                    && patientAddr?.Latitude != null 
                    && patientAddr?.Longitude != null)
                {
                    var (dist, t) = await _travelService.GetDistanceAndDurationAsync(
                        patientAddr.Latitude.Value,
                        patientAddr.Longitude.Value,
                        practitionerHomeAddr.Latitude.Value,
                        practitionerHomeAddr.Longitude.Value,
                        cancellationToken
                    );
                    returnTravelTime = t;
                }

                double effectiveReturnTime = isTargetInPerson ? Math.Max(returnTravelTime, 2) : 0;

                var finalReturnTime = appt.ScheduledEnd.AddMinutes(effectiveReturnTime);
                finalReturnTime = GeoUtils.CeilToNearestMinutes(finalReturnTime, 5);

                if (finalReturnTime > shiftEnd)
                {
                    return (
                        false,
                        $"Logistics Violation: This appointment would end after the practitioner's shift (including {Math.Round(effectiveReturnTime)}m travel time home)."
                    );
                }
            }

            return (true, null);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<
        List<Application.Appointments.Dtos.ReassignmentProviderDto>
    > GetAvailableProvidersForReassignmentAsync(
        Guid appointmentId,
        CancellationToken cancellationToken = default
    )
    {
        await _semaphore.WaitAsync(cancellationToken);
        try
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
            var patientAddr = appointment
                .Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)
                ?.Address;

            var settings = await context
                .TenantConfigurations.AsNoTracking()
                .OrderBy(c => c.TenantConfigurationId)
                .FirstOrDefaultAsync(cancellationToken);
            TimeZoneInfo tzi;
            try
            {
                tzi = TimeZoneInfo.FindSystemTimeZoneById(settings?.Timezone ?? TimeZoneInfo.Local.Id);
            }
            catch
            {
                tzi = TimeZoneInfo.Local;
            }

            var targetInTz = TimeZoneInfo.ConvertTime(appointment.ScheduledStart, tzi);
            var offset = targetInTz.Offset;
            var targetDate = targetInTz.Date;
            var dayOfWeek = targetDate.DayOfWeek;

            var startOfDay = new DateTimeOffset(
                targetDate.Year,
                targetDate.Month,
                targetDate.Day,
                0,
                0,
                0,
                offset
            );
            var endOfDay = startOfDay.AddDays(1);

            var practitionersWithShifts = await context
                .ProviderShifts.AsNoTracking()
                .Where(s => s.DayOfWeek == dayOfWeek && s.IsActive)
                .Select(s => s.PractitionerId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var shiftPractitionerIdSet = practitionersWithShifts
                .Select(id => (Guid?)id)
                .ToHashSet();
            var busyIds = await context
                .Appointments.Where(a =>
                    a.PractitionerId.HasValue
                    && shiftPractitionerIdSet.Contains(a.PractitionerId)
                    && a.Status != AppointmentStatus.Cancelled
                    && !a.IsDeleted
                    && a.ScheduledStart < end
                    && a.ScheduledEnd > start
                )
                .Select(a => a.PractitionerId!.Value)
                .Distinct()
                .ToListAsync(cancellationToken);

            var blockedIds = await context
                .ScheduleBlocks.Where(b =>
                    shiftPractitionerIdSet.Contains(b.PractitionerId)
                    && b.Status == ScheduleBlockStatus.Blocked
                    && !b.IsDeleted
                    && b.StartTime < end
                    && b.EndTime > start
                )
                .Select(b => b.PractitionerId)
                .Distinct()
                .ToListAsync(cancellationToken);

            var candidates = await context
                .Practitioners.AsNoTracking()
                .Where(p =>
                    p.IsActive
                    && practitionersWithShifts.Contains(p.PractitionerId)
                    && !busyIds.Contains(p.PractitionerId)
                    && !blockedIds.Contains(p.PractitionerId)
                )
                .ToListAsync(cancellationToken);

            var candidateIds = candidates.Select(c => c.PractitionerId).ToList();
            var candidateIdSet = candidateIds.Select(id => (Guid?)id).ToHashSet();

            var allDayAppts = await context
                .Appointments.AsNoTracking()
                .Include(a => a.Patient)
                    .ThenInclude(pat => pat.Addresses)
                        .ThenInclude(addr => addr.Address)
                .Where(a =>
                    a.PractitionerId.HasValue
                    && candidateIdSet.Contains(a.PractitionerId)
                    && a.ScheduledStart >= startOfDay
                    && a.ScheduledStart < endOfDay
                    && a.Status != AppointmentStatus.Cancelled
                    && !a.IsDeleted
                )
                .ToListAsync(cancellationToken);

            var dayApptsLookup = allDayAppts
                .Where(a => a.PractitionerId.HasValue)
                .GroupBy(a => a.PractitionerId!.Value)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(a => a.ScheduledStart).ToList());

            var practitionerAddressLookup = (
                await context
                    .EntityAddresses.AsNoTracking()
                    .Include(pa => pa.Address)
                    .Where(pa => candidateIdSet.Contains(pa.PractitionerId) && pa.IsPrimary)
                    .ToListAsync(cancellationToken)
            )
                .GroupBy(pa => pa.PractitionerId!.Value)
                .ToDictionary(g => g.Key, g => g.First().Address);

            var available = new List<Application.Appointments.Dtos.ReassignmentProviderDto>();
            bool isTargetInPerson = IsInPerson(appointment.Modality);

            var validationTasks = candidates.Select(async p => new
            {
                Practitioner = p,
                IsValid = await _travelService.ValidateTravelBufferAsync(
                    p.PractitionerId,
                    appointmentId,
                    cancellationToken
                )
            });
            var validationResults = await Task.WhenAll(validationTasks);

            foreach (var result in validationResults.Where(r => r.IsValid))
            {
                var p = result.Practitioner;
                    double? distance = null;
                    double? driveTime = null;

                    if (isTargetInPerson)
                    {
                        dayApptsLookup.TryGetValue(p.PractitionerId, out var dayAppts);

                        var prevInPerson = dayAppts?.FirstOrDefault(a =>
                            a.ScheduledStart < start && IsInPerson(a.Modality)
                        );

                        if (
                            prevInPerson != null
                            && patientAddr?.Latitude.HasValue == true
                            && patientAddr?.Longitude.HasValue == true
                        )
                        {
                            var prevAddr = prevInPerson
                                .Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)
                                ?.Address;
                            if (
                                prevAddr?.Latitude.HasValue == true
                                && prevAddr?.Longitude.HasValue == true
                            )
                            {
                                var (d, t) = await _travelService.GetDistanceAndDurationAsync(
                                    prevAddr.Latitude.Value,
                                    prevAddr.Longitude.Value,
                                    patientAddr.Latitude.Value,
                                    patientAddr.Longitude.Value,
                                    cancellationToken
                                );
                                distance = d;
                                driveTime = t;
                            }
                        }
                        else
                        {
                            practitionerAddressLookup.TryGetValue(
                                p.PractitionerId,
                                out var practAddr
                            );

                            if (
                                practAddr?.Latitude.HasValue == true
                                && practAddr?.Longitude.HasValue == true
                                && patientAddr?.Latitude.HasValue == true
                                && patientAddr?.Longitude.HasValue == true
                            )
                            {
                                var (d, t) = await _travelService.GetDistanceAndDurationAsync(
                                    practAddr.Latitude.Value,
                                    practAddr.Longitude.Value,
                                    patientAddr.Latitude.Value,
                                    patientAddr.Longitude.Value,
                                    cancellationToken
                                );
                                distance = d;
                                driveTime = t;
                            }
                        }
                    }

                    available.Add(
                        new Application.Appointments.Dtos.ReassignmentProviderDto
                        {
                            PractitionerId = p.PractitionerId,
                            FullName = p.FullName,
                            TravelTimeMinutes = driveTime,
                            DistanceInMiles = distance,
                            IsCareNavigator = p.IsCareNavigator,
                            IsSupportingClinician = p.IsSupportingClinician,
                            Position = p.Position.ToString(),
                        }
                    );
            }

            return available;
        }
        finally
        {
            _semaphore.Release();
        }
    }
}
