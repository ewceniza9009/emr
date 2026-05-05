using Application.Billing.Commands;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class BillingMutation
{
    public async Task<Guid> SubmitZBenefitClaim(
        SubmitZBenefitClaimCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Application.Billing.Dtos.BillingInvoiceDto> CreateInvoice(
        CreateInvoiceCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }
}
