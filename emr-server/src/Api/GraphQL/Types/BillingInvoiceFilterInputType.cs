using Application.Billing.Dtos;
using HotChocolate.Data.Filters;

namespace Api.GraphQL.Types;

public class BillingInvoiceFilterInputType : FilterInputType<BillingInvoiceDto>
{
    protected override void Configure(IFilterInputTypeDescriptor<BillingInvoiceDto> descriptor)
    {
        descriptor.Name("BillingInvoiceFilterInput");
    }
}
