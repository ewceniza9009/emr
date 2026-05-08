using Application.Billing.Dtos;
using HotChocolate.Data.Filters;

namespace Api.GraphQL.Types;

public class ZBenefitClaimFilterInputType : FilterInputType<ZBenefitClaimDto>
{
    protected override void Configure(IFilterInputTypeDescriptor<ZBenefitClaimDto> descriptor)
    {
        descriptor.Name("ZBenefitClaimFilterInput");
    }
}
