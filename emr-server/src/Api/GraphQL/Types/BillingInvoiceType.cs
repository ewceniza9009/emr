using Application.Billing.Dtos;
using HotChocolate.Types;

namespace Api.GraphQL.Types;

public class BillingInvoiceType : ObjectType<BillingInvoiceDto>
{
    protected override void Configure(IObjectTypeDescriptor<BillingInvoiceDto> descriptor)
    {
        descriptor.Name("BillingInvoice");
    }
}
