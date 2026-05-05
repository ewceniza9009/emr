using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class OutreachQuery
{
    public async Task<Application.Common.Models.PagedResponse<PatientOutreach>> GetOutreaches(
        [Service] IApplicationDbContext context,
        string? search = null,
        int skip = 0,
        int take = 50
    )
    {
        var query = context.PatientOutreaches.AsNoTracking();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(o =>
                o.FirstName.Contains(search)
                || o.LastName.Contains(search)
                || o.ReferralSource.Contains(search)
            );
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        return new Application.Common.Models.PagedResponse<PatientOutreach>
        {
            Items = items,
            TotalCount = totalCount,
        };
    }

    [UseFirstOrDefault]
    public IQueryable<PatientOutreach> GetOutreachById(
        Guid outreachId,
        [Service] IApplicationDbContext context
    )
    {
        return context
            .PatientOutreaches.Include(o => o.OtherContacts)
            .Where(o => o.PatientOutreachId == outreachId)
            .AsNoTracking();
    }

    [UseFiltering]
    [UseSorting]
    public IQueryable<OutreachScript> GetOutreachScripts([Service] IApplicationDbContext context)
    {
        return context.OutreachScripts.AsNoTracking();
    }
}
