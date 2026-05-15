using Api.GraphQL.Attributes;
using Application.Common.Interfaces;
using Domain.Entities;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class OutreachQuery
{
    [Authorize(Policy = "CanManageOutreach")]
    [UseOffsetPaging(DefaultPageSize = 50)]
    [UseFiltering]
    [UseSorting]
    public IQueryable<PatientOutreach> GetOutreaches(
        string? search,
        [Service] IApplicationDbContext context
    )
    {
        var query = context.PatientOutreaches.AsNoTracking();

        if (!string.IsNullOrEmpty(search))
        {
            var searchTerm = search.Trim().ToLower();
            query = query.Where(o =>
                o.FirstName.ToLower().StartsWith(searchTerm)
                || o.LastName.ToLower().StartsWith(searchTerm)
                || o.ReferralSource.ToLower().Contains(searchTerm)
                || (
                    searchTerm.Length > 2
                    && (
                        o.FirstName.ToLower().Contains(searchTerm)
                        || o.LastName.ToLower().Contains(searchTerm)
                    )
                )
            );
        }

        return query.OrderBy(o => o.LastName).ThenBy(o => o.FirstName);
    }

    [Authorize(Policy = "CanManageOutreach")]
    [UseClinicalAccess(argumentName: "outreachId", source: ClinicalIdSource.Outreach)]
    [UseFirstOrDefault]
    public async Task<IQueryable<PatientOutreach>> GetOutreachById(
        Guid outreachId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .PatientOutreaches.Where(o => o.PatientOutreachId == outreachId)
            .AsNoTracking();
    }
}
