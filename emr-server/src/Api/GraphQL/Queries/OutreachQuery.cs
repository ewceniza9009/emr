using Application.Common.Interfaces;
using Application.Outreach.Queries;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class OutreachQuery
{
    public async Task<Application.Common.Models.PagedResponse<PatientOutreach>> GetOutreaches(
        [Service] IMediator mediator,
        string? search = null,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default
    )
    {
        return await mediator.Send(new GetOutreachesQuery(search, skip, take), cancellationToken);
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
