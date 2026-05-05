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
                || o.ReferralSource.Contains(request.Search)
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip(request.Skip)
            .Take(request.Take)
            .ToListAsync(cancellationToken);

        return new PagedResponse<PatientOutreach> { Items = items, TotalCount = totalCount };
    }
}
