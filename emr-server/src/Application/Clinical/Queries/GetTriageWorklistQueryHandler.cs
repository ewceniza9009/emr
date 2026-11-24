using Application.Clinical.Dtos;
using Application.Common.Interfaces;
using Application.Common.Models;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Clinical.Queries;

public class GetTriageWorklistQueryHandler
    : IRequestHandler<GetTriageWorklistQuery, PagedResponse<TriageItemDto>>
{
    private readonly IApplicationDbContext _context;

    public GetTriageWorklistQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<TriageItemDto>> Handle(
        GetTriageWorklistQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _context.Patients.AsNoTracking();

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

        if (request.IsAlert.HasValue)
        {
            query = query.Where(p =>
                (
                    (
                        p.EsasAssessments.OrderByDescending(e => e.AssessedAt)
                            .Select(e => (bool?)(e.Pain > 7 || e.Wellbeing > 7))
                            .FirstOrDefault() == true
                        || p.CareNavigationCases.Any(c =>
                            c.AcuityLevel == Domain.Enums.AcuityLevel.Critical
                            && c.Status == Domain.Enums.CaseStatus.Open
                        )
                    )
                    && (p.TriageNote == null || !p.TriageNote.Contains("Claimed"))
                ) == request.IsAlert.Value
            );
        }

        if (request.DirectiveTypes != null && request.DirectiveTypes.Count > 0)
        {
            var includeNone = request.DirectiveTypes.Any(d =>
                string.Equals(d, "None", StringComparison.OrdinalIgnoreCase)
            );
            var validDirectives = request
                .DirectiveTypes.Select(d =>
                    Enum.TryParse<Domain.Enums.DirectiveType>(d, true, out var parsed)
                        ? (Domain.Enums.DirectiveType?)parsed
                        : null
                )
                .Where(d => d.HasValue)
                .Select(d => d!.Value)
                .ToList();

            if (includeNone && validDirectives.Count > 0)
            {
                query = query.Where(p =>
                    !p.AdvanceDirectives.Any(ad => ad.IsActive)
                    || p.AdvanceDirectives.Any(ad =>
                        ad.IsActive && validDirectives.Contains(ad.Type)
                    )
                );
            }
            else if (includeNone)
            {
                query = query.Where(p => !p.AdvanceDirectives.Any(ad => ad.IsActive));
            }
            else if (validDirectives.Count > 0)
            {
                query = query.Where(p =>
                    p.AdvanceDirectives.Any(ad =>
                        ad.IsActive && validDirectives.Contains(ad.Type)
                    )
                );
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(p => p.LastName)
            .ThenBy(p => p.FirstName)
            .Skip(request.Skip)
            .Take(request.Take)
            .ProjectToType<TriageItemDto>()
            .ToListAsync(cancellationToken);

        return new PagedResponse<TriageItemDto> { Items = items, TotalCount = totalCount };
    }
}
