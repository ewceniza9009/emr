using Application.Appointments.Dtos;
using Application.Common.Interfaces;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Queries;

public class GetAppointmentsByPatientQueryHandler
    : IRequestHandler<GetAppointmentsByPatientQuery, List<AppointmentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAppointmentsByPatientQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AppointmentDto>> Handle(
        GetAppointmentsByPatientQuery request,
        CancellationToken cancellationToken
    )
    {
        return await _context
            .Appointments.AsNoTracking()
            .Where(a => a.PatientId == request.PatientId)
            .OrderBy(a => a.ScheduledStart)
            .ProjectToType<AppointmentDto>()
            .ToListAsync(cancellationToken);
    }
}
