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
                p.EsasAssessments.OrderByDescending(e => e.AssessedAt)
                    .Any(e => e.Pain > 7 || e.Wellbeing > 7) == request.IsAlert.Value
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
