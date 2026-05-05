using Application.Clinical.Dtos;
using Application.Common.Interfaces;
using Application.Common.Models;
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
            query = query.Where(p =>
                p.FirstName.Contains(request.Search)
                || p.LastName.Contains(request.Search)
                || p.Mrn.Contains(request.Search)
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(p => p.LastName)
            .Skip(request.Skip)
            .Take(request.Take)
            .Select(p => new TriageItemDto
            {
                PatientId = p.PatientId,
                Mrn = p.Mrn,
                FirstName = p.FirstName,
                LastName = p.LastName,
                LatestPainScore = p
                    .EsasAssessments.OrderByDescending(e => e.AssessedAt)
                    .Select(e => e.Pain)
                    .FirstOrDefault(),
                LatestWellbeingScore = p
                    .EsasAssessments.OrderByDescending(e => e.AssessedAt)
                    .Select(e => e.Wellbeing)
                    .FirstOrDefault(),
                AdvanceDirectiveType =
                    p.AdvanceDirectives.Where(ad => ad.IsActive)
                        .Select(ad => ad.Type.ToString())
                        .FirstOrDefault()
                    ?? "None",
                IsAlert = p
                    .EsasAssessments.OrderByDescending(e => e.AssessedAt)
                    .Any(e => e.Pain > 7 || e.Wellbeing > 7),
            })
            .ToListAsync(cancellationToken);

        return new PagedResponse<TriageItemDto> { Items = items, TotalCount = totalCount };
    }
}
