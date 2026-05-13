using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Queries;

public class GetOutreachesQueryHandler
    : IRequestHandler<GetOutreachesQuery, PagedResponse<PatientOutreach>>
{
    private readonly IApplicationDbContext _context;

    public GetOutreachesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResponse<PatientOutreach>> Handle(
        GetOutreachesQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = _context.PatientOutreaches.AsNoTracking();

        if (!string.IsNullOrEmpty(request.Search))
        {
            query = query.Where(o =>
                o.FirstName.Contains(request.Search)
                || o.LastName.Contains(request.Search)
                || (o.ReferralSource != null && o.ReferralSource.Contains(request.Search))
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
            .ToListAsync(cancellationToken);

        // Optimized retroactive fill for legacy data (batch fetch to avoid N+1)
        var missingDataIds = items
            .Where(i => string.IsNullOrEmpty(i.LatestActivityOutcome))
            .Select(i => i.PatientOutreachId)
            .ToList();

        if (missingDataIds.Any())
        {
            var latestActivities = await _context.OutreachActivities
                .Where(a => missingDataIds.Contains(a.OutreachId))
                .OrderByDescending(a => a.ActivityDate)
                .ToListAsync(cancellationToken);

            var activityMap = latestActivities
                .GroupBy(a => a.OutreachId)
                .ToDictionary(g => g.Key, g => g.First());

            foreach (var item in items)
            {
                if (string.IsNullOrEmpty(item.LatestActivityOutcome) && activityMap.TryGetValue(item.PatientOutreachId, out var last))
                {
                    item.LatestActivityOutcome = last.Outcome;
                    item.LatestActivityReason = last.Reason;
                    item.LastActivityDate ??= last.ActivityDate;
                }
            }
        }

        return new PagedResponse<PatientOutreach> { Items = items, TotalCount = totalCount };
    }
}
