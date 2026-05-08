using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Patients.Dtos;
using Domain.Enums;
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
            var searchTerm = request.Search.ToLower();
            query = query.Where(p =>
                p.FirstName.ToLower().Contains(searchTerm)
                || p.LastName.ToLower().Contains(searchTerm)
                || p.Mrn.ToLower().Contains(searchTerm)
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .Skip(request.Skip)
            .Take(request.Take)
            .ProjectToType<PatientDto>()
            .ToListAsync(cancellationToken);

        // Map visit status manually based on the latest non-cancelled appointment
        foreach (var item in items)
        {
            var latestAppt = item.Appointments
                .Where(a => a.Status != AppointmentStatus.Cancelled)
                .OrderByDescending(a => a.ScheduledStart)
                .FirstOrDefault();

            if (latestAppt != null)
            {
                item.VisitStatus = latestAppt.Status.ToString();
            }
            else
            {
                item.VisitStatus = "No Visit";
            }
        }

        return new PagedResponse<PatientDto> { Items = items, TotalCount = totalCount };
    }
}
