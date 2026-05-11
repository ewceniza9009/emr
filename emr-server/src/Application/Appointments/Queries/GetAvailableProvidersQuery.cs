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
    AppointmentModality Modality,
    Guid? AppointmentId = null
) : IRequest<List<AvailableProviderDto>>;

public class GetAvailableProvidersQueryHandler(
    ISchedulingService schedulingService,
    IApplicationDbContext context
) : IRequestHandler<GetAvailableProvidersQuery, List<AvailableProviderDto>>
{
    public async Task<List<AvailableProviderDto>> Handle(
        GetAvailableProvidersQuery request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var duration = TimeSpan.FromMinutes(request.DurationMinutes);

            var slots = await schedulingService.GetAvailableProvidersAsync(
                request.TargetStart,
                duration,
                request.Modality,
                request.PatientId,
                request.AppointmentId,
                cancellationToken
            );

            if (slots.Count == 0)
                return [];

            var practitionerIds = slots.Select(d => d.PractitionerId).Distinct().ToList();

            var practitioners = await context
                .Practitioners.AsNoTracking()
                .Where(p => practitionerIds.Contains(p.PractitionerId))
                .ToListAsync(cancellationToken);

            return slots
                .Select(s =>
                {
                    var p = practitioners.FirstOrDefault(x => x.PractitionerId == s.PractitionerId);
                    if (p == null)
                        return null;

                    return new AvailableProviderDto
                    {
                        PractitionerId = s.PractitionerId,
                        FullName = $"{p.FirstName} {p.LastName}",
                        Role = p.IsCareNavigator ? "CareNavigator" : "Physician",
                        Position = p.Position.ToString(),
                        DistanceInMiles = s.DistanceInMiles,
                        TravelTimeInMinutes = s.TravelTimeInMinutes,
                        ShiftStart = s.StartTime,
                        ShiftEnd = s.EndTime,
                    };
                })
                .Where(x => x != null)
                .Cast<AvailableProviderDto>()
                .OrderBy(x => x.ShiftStart)
                .ThenBy(x => x.TravelTimeInMinutes)
                .ToList();
        }
        catch (OperationCanceledException)
        {
            // Gracefully handle cancellation from debounced frontend requests
            return [];
        }
    }
}
