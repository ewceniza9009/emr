using Application.Common.Interfaces;
using Application.Billing.Dtos;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class BillingQuery
{
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<ZBenefitClaimDto> GetZBenefitClaims(
        [Service] IApplicationDbContext context)
    {
        return context.ZBenefitClaims
            .AsNoTracking()
            .ProjectToType<ZBenefitClaimDto>();
    }
}
