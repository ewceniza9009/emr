using Application.Appointments.Dtos;
using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Queries;

public record GetAvailableProvidersQuery(
    Guid PatientId,
    DateTimeOffset TargetStart,
    int DurationMinutes,
    AppointmentModality Modality
) : IRequest<List<AvailableProviderDto>>;

public class GetAvailableProvidersQueryHandler(
    ISchedulingService schedulingService,
    IApplicationDbContext context
) : IRequestHandler<GetAvailableProvidersQuery, List<AvailableProviderDto>>
{
    public async Task<List<AvailableProviderDto>> Handle(
        GetAvailableProvidersQuery request,
        CancellationToken cancellationToken)
    {
        var duration = TimeSpan.FromMinutes(request.DurationMinutes);

        var distances = await schedulingService.GetAvailableProvidersAsync(
            request.TargetStart,
            duration,
            request.Modality,
            request.PatientId,
            cancellationToken);

        if (distances.Count == 0) return [];

        var practitionerIds = distances.Select(d => d.ProviderId).ToList();

        // Fetch practitioner details and shifts in parallel
        var practitioners = await context.Practitioners
            .Where(p => practitionerIds.Contains(p.PractitionerId))
            .ToListAsync(cancellationToken);

        var shifts = await context.ProviderShifts
            .Where(s => practitionerIds.Contains(s.PractitionerId)
                        && s.DayOfWeek == request.TargetStart.DayOfWeek)
            .ToListAsync(cancellationToken);

        return distances.Select(d =>
        {
            var p = practitioners.First(x => x.PractitionerId == d.ProviderId);
            var shift = shifts.FirstOrDefault(s => s.PractitionerId == d.ProviderId);

            return new AvailableProviderDto
            {
                PractitionerId = d.ProviderId,
                FullName = $"{p.FirstName} {p.LastName}",
                Role = p.NpiNumber != null ? "Physician" : "Care Navigator",
                DistanceInMiles = d.DistanceInMiles,
                TravelTimeInMinutes = d.TravelTimeInMinutes,
                ShiftStart = shift != null
                    ? request.TargetStart.Date.Add(shift.StartTime)
                    : request.TargetStart,
                ShiftEnd = shift != null
                    ? request.TargetStart.Date.Add(shift.EndTime)
                    : request.TargetStart.AddHours(8),
            };
        }).OrderBy(x => x.TravelTimeInMinutes).ToList();
    }
}
