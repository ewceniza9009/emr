using System.Linq;
using Application.Billing.Commands;
using HotChocolate.Authorization;
using MediatR;

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

    public async Task<Application.Billing.Dtos.BillingInvoiceDto> CreateBillingInvoice(
        CreateInvoiceCommandInput input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var command = new CreateInvoiceCommand
        {
            PatientId = input.PatientId,
            EncounterId = input.EncounterId,
            ClaimId = input.ClaimId,
            SubtotalAmount = input.SubtotalAmount,
            CoveredAmount = input.CoveredAmount,
            DueInDays = input.DueInDays ?? 30,
            Items = input
                .Items.Select(i => new InvoiceItemInput(i.Description, i.Quantity, i.UnitPrice))
                .ToList(),
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
        UpdateInvoiceCommandInput command,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        var mediatorCommand = new UpdateInvoiceCommand
        {
            InvoiceId = command.InvoiceId,
            SubtotalAmount = command.SubtotalAmount,
            CoveredAmount = command.CoveredAmount,
            DueInDays = command.DueInDays ?? 30,
        };

        return await mediator.Send(mediatorCommand, cancellationToken);
    }
}

public record CreateInvoiceCommandInput(
    Guid PatientId,
    Guid? EncounterId,
    Guid? ClaimId,
    decimal SubtotalAmount,
    decimal CoveredAmount,
    int? DueInDays,
    List<InvoiceItemInputRecord> Items
);

public record InvoiceItemInputRecord(string Description, decimal Quantity, decimal UnitPrice);

public record UpdateInvoiceCommandInput(
    Guid InvoiceId,
    decimal SubtotalAmount,
    decimal CoveredAmount,
    int? DueInDays
);
