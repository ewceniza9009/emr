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
    public IQueryable<PatientOutreach> GetOutreaches([Service] IApplicationDbContext context)
    {
        return context.PatientOutreaches.Include(o => o.Activities).AsNoTracking();
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
