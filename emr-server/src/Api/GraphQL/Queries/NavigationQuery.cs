using Application.Common.Interfaces;
using Application.Navigation.Dtos;
using Domain.Entities;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class NavigationQuery
{
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<CareNavigationCaseDto> GetCareNavigationCases(
        [Service] IApplicationDbContext context
    )
    {
        return context.CareNavigationCases.AsNoTracking().ProjectToType<CareNavigationCaseDto>();
    }

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<HealthPlan> GetHealthPlans([Service] IApplicationDbContext context)
    {
        return context.HealthPlans.AsNoTracking();
    }

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Facility> GetFacilities([Service] IApplicationDbContext context)
    {
        return context.Facilities.AsNoTracking();
    }

    /// <summary>
    /// Returns all practitioners (providers) with their position, user link,
    /// and geospatial data. Used by the scheduling calendar for filtering.
    /// </summary>
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Practitioner> GetPractitioners([Service] IApplicationDbContext context)
    {
        return context.Practitioners.Include(p => p.Addresses).AsNoTracking();
    }
}
