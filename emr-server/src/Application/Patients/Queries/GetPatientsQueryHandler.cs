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
        var query = _context.Patients.AsNoTracking().Where(p => p.IsActive);

        if (!string.IsNullOrEmpty(request.Search))
        {
            var searchTerm = request.Search.Trim().ToLower();
            query = query.Where(p =>
                p.FirstName.ToLower().StartsWith(searchTerm)
                || p.LastName.ToLower().StartsWith(searchTerm)
                || p.Mrn.ToLower().Contains(searchTerm)
                || (
                    searchTerm.Length > 2
                    && (p.FirstName.ToLower().Contains(searchTerm) || p.LastName.ToLower().Contains(searchTerm))
                )
            );
        }

        if (request.DirectiveTypes != null && request.DirectiveTypes.Any())
        {
            if (request.DirectiveTypes.Contains("None"))
            {
                query = query.Where(p =>
                    !p.AdvanceDirectives.Any(ad => ad.IsActive)
                    || p.AdvanceDirectives.Any(ad =>
                        ad.IsActive && request.DirectiveTypes.Contains(ad.Type.ToString())
                    )
                );
            }
            else
            {
                query = query.Where(p =>
                    p.AdvanceDirectives.Any(ad =>
                        ad.IsActive && request.DirectiveTypes.Contains(ad.Type.ToString())
                    )
                );
            }
        }

        if (
            !string.IsNullOrEmpty(request.BiologicalSex)
            && Enum.TryParse<BiologicalSex>(request.BiologicalSex, true, out var sex)
        )
        {
            query = query.Where(p => p.BiologicalSex == sex);
        }

        if (request.VisitStatuses != null && request.VisitStatuses.Any())
        {
            query = query.Where(p =>
                request.VisitStatuses.Contains(
                    p.Appointments.Where(a => a.Status != AppointmentStatus.Cancelled)
                        .OrderByDescending(a => a.ScheduledStart)
                        .Select(a => a.Status.ToString())
                        .FirstOrDefault()
                        ?? "No Visit"
                )
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

        return new PagedResponse<PatientDto> { Items = items, TotalCount = totalCount };
    }
}
