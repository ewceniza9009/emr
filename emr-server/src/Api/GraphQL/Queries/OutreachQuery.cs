using Api.GraphQL.Attributes;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
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

    [Authorize(Policy = "CanManageOutreach")]
    public async Task<OutreachMetricsDto> GetOutreachMetrics([Service] IApplicationDbContext context)
    {
        return new OutreachMetricsDto
        {
            NewLeadsCount = await context.PatientOutreaches.CountAsync(o => o.Status == OutreachStatus.Lead),
            ContactedCount = await context.PatientOutreaches.CountAsync(o => o.Status == OutreachStatus.Contacted),
            InterestedCount = await context.PatientOutreaches.CountAsync(o => o.Status == OutreachStatus.Interested),
            EnrolledCount = await context.PatientOutreaches.CountAsync(o => o.Status == OutreachStatus.Enrolled)
        };
    }
}

public class OutreachMetricsDto
{
    public int NewLeadsCount { get; set; }
    public int ContactedCount { get; set; }
    public int InterestedCount { get; set; }
    public int EnrolledCount { get; set; }
}
