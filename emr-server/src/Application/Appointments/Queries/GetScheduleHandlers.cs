using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Queries;

public class GetAppointmentsQueryHandler
    : IRequestHandler<GetAppointmentsQuery, PagedResponse<Appointment>>
{
    private readonly IApplicationDbContext _context;

    public GetAppointmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<Appointment>> Handle(
        GetAppointmentsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _context
            .Appointments.Include(a => a.Patient)
                .ThenInclude(p => p!.Addresses)
            .Include(a => a.Practitioner)
            .Include(a => a.SupportingClinicians)
            .AsNoTracking();

        if (request.StartDate.HasValue)
            query = query.Where(a => a.ScheduledStart >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(a => a.ScheduledEnd <= request.EndDate.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.ToListAsync(cancellationToken);

        return new PagedResponse<Appointment> { Items = items, TotalCount = totalCount };
    }
}

public class GetScheduleBlocksQueryHandler
    : IRequestHandler<GetScheduleBlocksQuery, PagedResponse<ScheduleBlock>>
{
    private readonly IApplicationDbContext _context;

    public GetScheduleBlocksQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<ScheduleBlock>> Handle(
        GetScheduleBlocksQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _context.ScheduleBlocks.Include(b => b.Practitioner).AsNoTracking();

        if (request.StartDate.HasValue)
            query = query.Where(b => b.StartTime >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(b => b.EndTime <= request.EndDate.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.ToListAsync(cancellationToken);

        return new PagedResponse<ScheduleBlock> { Items = items, TotalCount = totalCount };
    }
}
