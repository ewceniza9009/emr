using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class OutreachQuery
{
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<PatientOutreach> GetOutreaches([Service] IApplicationDbContext context)
    {
        return context.PatientOutreaches.AsNoTracking();
    }

    [UseFirstOrDefault]
    [UseProjection]
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
}
