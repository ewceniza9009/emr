using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Patients.Dtos;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Queries;

public class GetPatientsQueryHandler : IRequestHandler<GetPatientsQuery, PagedResponse<PatientDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPatientsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<PatientDto>> Handle(
        GetPatientsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _context.Patients.AsNoTracking();

        if (!string.IsNullOrEmpty(request.Search))
        {
            query = query.Where(p =>
                p.FirstName.Contains(request.Search)
                || p.LastName.Contains(request.Search)
                || p.Mrn.Contains(request.Search)
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .Include(p => p.Appointments)
            .OrderBy(p => p.LastName)
            .Skip(request.Skip)
            .Take(request.Take)
            .ProjectToType<PatientDto>()
            .ToListAsync(cancellationToken);

        // Map visit status manually based on the latest non-cancelled appointment
        foreach (var item in items)
        {
            var latestAppt = item.Appointments
                .Where(a => a.Status != "Cancelled")
                .OrderByDescending(a => a.ScheduledStart)
                .FirstOrDefault();

            if (latestAppt != null)
            {
                item.VisitStatus = latestAppt.Status;
            }
            else
            {
                item.VisitStatus = "No Visit";
            }
        }

        return new PagedResponse<PatientDto> { Items = items, TotalCount = totalCount };
    }
}
