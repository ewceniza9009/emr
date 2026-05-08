using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Patients.Dtos;
using Domain.Enums;
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
            .Select(p => new PatientDto
            {
                PatientId = p.PatientId,
                Mrn = p.Mrn,
                FirstName = p.FirstName,
                LastName = p.LastName,
                Dob = p.Dob,
                CreatedAt = p.CreatedAt,
                VisitStatus =
                    p.Appointments.Where(a => a.Status != AppointmentStatus.Cancelled)
                        .OrderByDescending(a => a.ScheduledStart)
                        .Select(a => a.Status.ToString())
                        .FirstOrDefault()
                    ?? "No Visit",
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<PatientDto> { Items = items, TotalCount = totalCount };
    }
}
