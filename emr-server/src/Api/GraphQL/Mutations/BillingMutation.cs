using Application.Billing.Commands;
using HotChocolate.Authorization;
using MediatR;
using System.Linq;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanManageBilling")]
public class BillingMutation
{
    public async Task<Guid> SubmitZBenefitClaim(
        SubmitZBenefitClaimCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(command, cancellationToken);
    }

    public async Task<Application.Billing.Dtos.BillingInvoiceDto> CreateInvoice(
        CreateInvoiceInput input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var command = new CreateInvoiceCommand
        {
            PatientId = input.PatientId,
            EncounterId = input.EncounterId,
            SubtotalAmount = input.SubtotalAmount,
            CoveredAmount = input.CoveredAmount,
            DueInDays = input.DueInDays ?? 30,
            Items = input.Items.Select(i => new InvoiceItemInput(
                i.Description,
                i.Quantity,
                i.UnitPrice
            )).ToList()
        };

        return await mediator.Send(command, cancellationToken);
    }

    public async Task<bool> UpdateClaimStatus(
        UpdateClaimStatusCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(command, cancellationToken);
    }

    public async Task<bool> VoidInvoice(
        VoidInvoiceCommand command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(command, cancellationToken);
    }

    public async Task<Application.Billing.Dtos.BillingInvoiceDto> UpdateInvoice(
        UpdateInvoiceInput input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var command = new UpdateInvoiceCommand
        {
            InvoiceId = input.InvoiceId,
            SubtotalAmount = input.SubtotalAmount,
            CoveredAmount = input.CoveredAmount,
            DueInDays = input.DueInDays ?? 30
        };

        return await mediator.Send(command, cancellationToken);
    }
}

public record CreateInvoiceInput(
    Guid PatientId,
    Guid? EncounterId,
    decimal SubtotalAmount,
    decimal CoveredAmount,
    int? DueInDays,
    List<InvoiceItemInputRecord> Items
);

public record InvoiceItemInputRecord(
    string Description,
    decimal Quantity,
    decimal UnitPrice
);

public record UpdateInvoiceInput(
    Guid InvoiceId,
    decimal SubtotalAmount,
    decimal CoveredAmount,
    int? DueInDays
);
