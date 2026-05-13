using Application.Common.Interfaces;
using Application.Common.Utils;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Services;

public class TravelService : ITravelService
{
    private readonly IDbContextFactory<ApplicationDbContext> _dbFactory;
    private const int FALLBACK_IN_PERSON_BUFFER = 5;
    private const int TELEHEALTH_BUFFER_MINS = 3;

    public TravelService(IDbContextFactory<ApplicationDbContext> dbFactory)
    {
        _dbFactory = dbFactory;
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

        var settings = await context.TenantConfigurations.FirstOrDefaultAsync(ct);
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
                       a.ScheduledStart.Date == appt.ScheduledStart.Date &&
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
                var dist = GeoUtils.CalculateDistance(prevAddr.Latitude.Value, prevAddr.Longitude.Value, patientAddr.Latitude.Value, patientAddr.Longitude.Value);
                var driveTime = GeoUtils.EstimateTravelTimeMinutes(dist);
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
                var dist = GeoUtils.CalculateDistance(patientAddr.Latitude.Value, patientAddr.Longitude.Value, nextAddr.Latitude.Value, nextAddr.Longitude.Value);
                var driveTime = GeoUtils.EstimateTravelTimeMinutes(dist);
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
