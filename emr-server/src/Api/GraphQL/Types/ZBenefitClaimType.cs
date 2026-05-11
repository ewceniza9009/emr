using Api.GraphQL.DataLoaders;
using Application.Billing.Dtos;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Types;

namespace Api.GraphQL.Types;

public class ZBenefitClaimType : ObjectType<ZBenefitClaimDto>
{
    protected override void Configure(IObjectTypeDescriptor<ZBenefitClaimDto> descriptor)
    {
        descriptor.Name("ZBenefitClaim");

        descriptor
            .Field("statusLogs")
            .ResolveWith<ZBenefitClaimResolvers>(r =>
                r.GetStatusLogs(default!, default!, default!)
            );
    }

    private class ZBenefitClaimResolvers
    {
        public async Task<IEnumerable<ClaimStatusLog>> GetStatusLogs(
            [Parent] ZBenefitClaimDto claim,
            ClaimLogsByClaimIdDataLoader dataLoader,
            CancellationToken cancellationToken
        )
        {
            return await dataLoader.LoadAsync(claim.ClaimId, cancellationToken);
        }
    }
}
