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

        // Aggressive retroactive fill for legacy data
        foreach (var item in items)
        {
            if (string.IsNullOrEmpty(item.LatestActivityOutcome))
            {
                var last = await _context.OutreachActivities
                    .Where(a => a.OutreachId == item.PatientOutreachId)
                    .OrderByDescending(a => a.ActivityDate)
                    .FirstOrDefaultAsync(cancellationToken);
                
                if (last != null)
                {
                    item.LatestActivityOutcome = last.Outcome;
                    item.LatestActivityReason = last.Reason;
                    // Heal the missing activity date if possible
                    item.LastActivityDate ??= last.ActivityDate;
                }
            }
        }

        return new PagedResponse<PatientOutreach> { Items = items, TotalCount = totalCount };
    }
}
