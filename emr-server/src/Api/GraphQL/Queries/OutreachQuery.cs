using Application.Common.Interfaces;
using Domain.Entities;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;
using Api.GraphQL.Attributes;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanManageOutreach")]
public class OutreachQuery
{
    [UseOffsetPaging(DefaultPageSize = 50)]
    [UseFiltering]
    [UseSorting]
    public IQueryable<PatientOutreach> GetOutreaches(
        string? search,
        [Service] IApplicationDbContext context
    )
    {
        var query = context.PatientOutreaches.Include(o => o.Activities).AsNoTracking();

        if (!string.IsNullOrEmpty(search))
        {
            var searchTerm = search.Trim().ToLower();
            query = query.Where(o =>
                o.FirstName.ToLower().StartsWith(searchTerm)
                || o.LastName.ToLower().StartsWith(searchTerm)
                || o.ReferralSource.ToLower().Contains(searchTerm)
                || (searchTerm.Length > 2 && (o.FirstName.ToLower().Contains(searchTerm) || o.LastName.ToLower().Contains(searchTerm)))
            );
        }

        return query;
    }

    [UseClinicalAccess(argumentName: "outreachId", source: ClinicalIdSource.Outreach)]
    [UseFirstOrDefault]
    public async Task<IQueryable<PatientOutreach>> GetOutreachById(
        Guid outreachId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .PatientOutreaches.Include(o => o.OtherContacts)
            .Include(o => o.Activities)
            .Where(o => o.PatientOutreachId == outreachId)
            .AsNoTracking();
    }
}
