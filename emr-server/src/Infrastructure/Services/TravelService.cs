using Application.Common.Interfaces;
using Application.Common.Utils;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class TravelService : ITravelService
{
    private readonly IDbContextFactory<ApplicationDbContext> _dbFactory;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<TravelService> _logger;
    private const int FALLBACK_IN_PERSON_BUFFER = 5;
    private const int TELEHEALTH_BUFFER_MINS = 3;

    private DateTimeOffset _lastOsrmFailure = DateTimeOffset.MinValue;
    private readonly TimeSpan CircuitBreakerDuration = TimeSpan.FromMinutes(2);
    private bool? _enableOsrmCached;

    public TravelService(
        IDbContextFactory<ApplicationDbContext> dbFactory,
        IHttpClientFactory httpClientFactory,
        ILogger<TravelService> logger
    )
    {
        _dbFactory = dbFactory;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<(double distanceInMiles, double durationInMinutes)> GetDistanceAndDurationAsync(
        double startLat,
        double startLon,
        double endLat,
        double endLon,
        CancellationToken ct = default
    )
    {
        var fallbackDistance = GeoUtils.CalculateDistance(startLat, startLon, endLat, endLon);
        var fallbackDuration = GeoUtils.EstimateTravelTimeMinutes(fallbackDistance);

        if (!_enableOsrmCached.HasValue)
        {
            try
            {
                using var context = await _dbFactory.CreateDbContextAsync(ct);
                var settings = await context.TenantConfigurations
                    .AsNoTracking()
                    .OrderBy(c => c.TenantConfigurationId)
                    .FirstOrDefaultAsync(ct);
                _enableOsrmCached = settings?.EnableOsrmTravel ?? false;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, ">>> Failed to load TenantConfiguration. Defaulting EnableOsrmTravel to false.");
                _enableOsrmCached = false;
            }
        }

        if (!_enableOsrmCached.Value)
        {
            _logger.LogDebug(">>> OSRM ROUTE CALCULATION DISABLED: Falling back to Haversine.");
            return (fallbackDistance, fallbackDuration);
        }

        // Circuit breaker: if OSRM failed recently within this scoped request, bypass to prevent sequential query cancellation
        if (DateTimeOffset.UtcNow - _lastOsrmFailure < CircuitBreakerDuration)
        {
            _logger.LogDebug(">>> OSRM CIRCUIT BREAKER ACTIVE: Skipping OSRM call, immediately falling back to Haversine.");
            return (fallbackDistance, fallbackDuration);
        }

        try
        {
            var client = _httpClientFactory.CreateClient("OSRM");
            var url = $"route/v1/driving/{startLon.ToString(System.Globalization.CultureInfo.InvariantCulture)},{startLat.ToString(System.Globalization.CultureInfo.InvariantCulture)};{endLon.ToString(System.Globalization.CultureInfo.InvariantCulture)},{endLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}?overview=false";

            // Enforce a strict short timeout for the OSRM HTTP call (e.g. 500ms) to prevent blocking the query thread
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromMilliseconds(500));

            _logger.LogInformation(">>> OSRM ROUTE CALL: Querying route from ({Lat1},{Lon1}) to ({Lat2},{Lon2})", startLat, startLon, endLat, endLon);
            var response = await client.GetAsync(url, cts.Token);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(">>> OSRM ROUTE FAILED (HTTP Status {Status}): Falling back to Haversine.", response.StatusCode);
                _lastOsrmFailure = DateTimeOffset.UtcNow; // Trigger circuit breaker
                return (fallbackDistance, fallbackDuration);
            }

            var content = await response.Content.ReadAsStringAsync(cts.Token);
            using var document = JsonDocument.Parse(content);
            var root = document.RootElement;
            if (root.TryGetProperty("code", out var codeProp) && codeProp.GetString() == "Ok" &&
                root.TryGetProperty("routes", out var routesProp) && routesProp.GetArrayLength() > 0)
            {
                var firstRoute = routesProp[0];
                double distanceInMeters = 0;
                if (firstRoute.TryGetProperty("distance", out var distProp))
                {
                    distanceInMeters = distProp.GetDouble();
                }
                
                double durationInSeconds = 0;
                if (firstRoute.TryGetProperty("duration", out var durProp))
                {
                    durationInSeconds = durProp.GetDouble();
                }

                double distanceInMiles = distanceInMeters * 0.000621371;
                double durationInMinutes = durationInSeconds / 60.0;

                _logger.LogInformation(">>> OSRM ROUTE SUCCESS: Distance = {Distance:F2} mi, Duration = {Duration:F1} min", distanceInMiles, durationInMinutes);
                return (distanceInMiles, durationInMinutes);
            }
            
            _logger.LogWarning(">>> OSRM ROUTE PARSE FAILURE: 'routes' element missing or empty. Falling back to Haversine.");
            _lastOsrmFailure = DateTimeOffset.UtcNow; // Trigger circuit breaker
            return (fallbackDistance, fallbackDuration);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, ">>> OSRM ROUTE EXCEPTION: Falling back to Haversine. Error: {Message}", ex.Message);
            _lastOsrmFailure = DateTimeOffset.UtcNow; // Trigger circuit breaker
            return (fallbackDistance, fallbackDuration);
        }
    }

    public async Task<bool> ValidateTravelBufferAsync(Guid practitionerId, Guid appointmentId, CancellationToken ct)
    {
        using var context = await _dbFactory.CreateDbContextAsync(ct);
        
        var appt = await context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)
                .ThenInclude(p => p.Addresses)
                    .ThenInclude(a => a.Address)
            .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId, ct);

        if (appt == null || appt.Modality == AppointmentModality.TelehealthVideo || appt.Modality == AppointmentModality.Telephone)
            return true;

        var patientAddr = appt.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
        if (patientAddr == null || !patientAddr.Latitude.HasValue || !patientAddr.Longitude.HasValue)
            return true;

        var settings = await context.TenantConfigurations
            .OrderBy(c => c.TenantConfigurationId)
            .FirstOrDefaultAsync(ct);

        TimeZoneInfo tzi;
        try
        {
            tzi = TimeZoneInfo.FindSystemTimeZoneById(settings?.Timezone ?? TimeZoneInfo.Local.Id);
        }
        catch
        {
            tzi = TimeZoneInfo.Local;
        }

        var apptInTz = TimeZoneInfo.ConvertTime(appt.ScheduledStart, tzi);
        var offset = apptInTz.Offset;
        var apptDate = apptInTz.Date;
        var startOfDay = new DateTimeOffset(apptDate, offset);
        var endOfDay = startOfDay.AddDays(1);

        var safetyBuffer = settings?.EngineSafetyDriveMins ?? FALLBACK_IN_PERSON_BUFFER;
        var buffer = appt.Modality == AppointmentModality.InPersonHomeVisit || appt.Modality == AppointmentModality.InPersonFacility 
            ? safetyBuffer 
            : TELEHEALTH_BUFFER_MINS;

        var dayAppts = await context.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)
                .ThenInclude(p => p.Addresses)
                    .ThenInclude(a => a.Address)
            .Where(a => a.PractitionerId == practitionerId && 
                       a.ScheduledStart >= startOfDay && 
                       a.ScheduledStart < endOfDay &&
                       a.AppointmentId != appointmentId &&
                       a.Status != AppointmentStatus.Cancelled &&
                       !a.IsDeleted)
            .OrderBy(a => a.ScheduledStart)
            .ToListAsync(ct);

        var prev = dayAppts.LastOrDefault(a => a.ScheduledStart < appt.ScheduledStart);
        if (prev != null)
        {
            var prevAddr = prev.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
            if (prevAddr?.Latitude.HasValue == true && prevAddr?.Longitude.HasValue == true)
            {
                var (dist, driveTime) = await GetDistanceAndDurationAsync(
                    prevAddr.Latitude.Value,
                    prevAddr.Longitude.Value,
                    patientAddr.Latitude.Value,
                    patientAddr.Longitude.Value,
                    ct
                );
                var effectiveDriveTime = Math.Max(driveTime, 2);
                if (appt.ScheduledStart < prev.ScheduledEnd.AddMinutes(buffer + effectiveDriveTime))
                    return false;
            }
        }

        var next = dayAppts.FirstOrDefault(a => a.ScheduledStart > appt.ScheduledStart);
        if (next != null)
        {
            var nextAddr = next.Patient?.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address;
            if (nextAddr?.Latitude.HasValue == true && nextAddr?.Longitude.HasValue == true)
            {
                var (dist, driveTime) = await GetDistanceAndDurationAsync(
                    patientAddr.Latitude.Value,
                    patientAddr.Longitude.Value,
                    nextAddr.Latitude.Value,
                    nextAddr.Longitude.Value,
                    ct
                );
                var effectiveDriveTime = Math.Max(driveTime, 2);
                var nextIsInPerson = next.Modality == AppointmentModality.InPersonHomeVisit || next.Modality == AppointmentModality.InPersonFacility;
                var nextBuffer = nextIsInPerson ? safetyBuffer : TELEHEALTH_BUFFER_MINS;
                if (appt.ScheduledEnd.AddMinutes(effectiveDriveTime + nextBuffer) > next.ScheduledStart)
                    return false;
            }
        }

        return true;
    }
}
