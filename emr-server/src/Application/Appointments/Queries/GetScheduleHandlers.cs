using Application.Appointments.Dtos;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Queries;

public class GetAppointmentsQueryHandler
    : IRequestHandler<GetAppointmentsQuery, PagedResponse<AppointmentDto>>
{
    private readonly IApplicationDbContext _context;

    public GetAppointmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<AppointmentDto>> Handle(
        GetAppointmentsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _context.Appointments.AsNoTracking();

        if (request.StartDate.HasValue)
            query = query.Where(a => a.ScheduledStart >= request.StartDate.Value);

        if (request.EndDate.HasValue)
            query = query.Where(a => a.ScheduledEnd <= request.EndDate.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(a => a.ScheduledStart)
            .Skip(request.Skip)
            .Take(request.Take)
            .ProjectToType<AppointmentDto>()
            .ToListAsync(cancellationToken);

        return new PagedResponse<AppointmentDto> { Items = items, TotalCount = totalCount };
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

        var items = await query
            .OrderBy(b => b.StartTime)
            .Skip(request.Skip)
            .Take(request.Take)
            .ToListAsync(cancellationToken);

        return new PagedResponse<ScheduleBlock> { Items = items, TotalCount = totalCount };
    }
}
