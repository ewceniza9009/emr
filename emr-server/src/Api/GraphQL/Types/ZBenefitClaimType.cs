using Application.Billing.Dtos;
using HotChocolate.Types;

namespace Api.GraphQL.Types;

public class ZBenefitClaimType : ObjectType<ZBenefitClaimDto>
{
    protected override void Configure(IObjectTypeDescriptor<ZBenefitClaimDto> descriptor)
    {
        descriptor.Name("ZBenefitClaim");
    }
}
