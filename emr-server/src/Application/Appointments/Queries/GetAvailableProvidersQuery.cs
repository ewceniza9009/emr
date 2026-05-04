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
        CancellationToken cancellationToken
    )
    {
        var duration = TimeSpan.FromMinutes(request.DurationMinutes);

        var slots = await schedulingService.GetAvailableProvidersAsync(
            request.TargetStart,
            duration,
            request.Modality,
            request.PatientId,
            cancellationToken
        );

        if (slots.Count == 0)
            return [];

        var practitionerIds = slots.Select(d => d.PractitionerId).Distinct().ToList();

        var practitioners = await context
            .Practitioners.Where(p => practitionerIds.Contains(p.PractitionerId))
            .ToListAsync(cancellationToken);

        return slots
            .Select(s =>
            {
                var p = practitioners.First(x => x.PractitionerId == s.PractitionerId);

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
            .OrderBy(x => x.ShiftStart)
            .ThenBy(x => x.TravelTimeInMinutes)
            .ToList();
    }
}
