using Application.Common.Interfaces;
using Application.Navigation.Dtos;
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
        [Service] IApplicationDbContext context)
    {
        return context.CareNavigationCases
            .AsNoTracking()
            .ProjectToType<CareNavigationCaseDto>();
    }
}
