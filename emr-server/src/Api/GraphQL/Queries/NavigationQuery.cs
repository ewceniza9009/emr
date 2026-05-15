using Application.Common.Interfaces;
using Application.Navigation.Dtos;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Authorization;
using HotChocolate.Data;
using HotChocolate.Types;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class NavigationQuery
{
    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    public IQueryable<CareNavigationCaseDto> GetCareNavigationCases(
        [Service] IApplicationDbContext context
    )
    {
        return context.CareNavigationCases.AsNoTracking().ProjectToType<CareNavigationCaseDto>();
    }

}
