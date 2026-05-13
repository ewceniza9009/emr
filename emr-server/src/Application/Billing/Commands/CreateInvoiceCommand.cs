using Application.Billing.Dtos;
using MediatR;
using System.Collections.Generic;

namespace Application.Billing.Commands;

public record CreateInvoiceCommand : IRequest<BillingInvoiceDto>
{
    public Guid PatientId { get; init; }
    public Guid? EncounterId { get; init; }
    public Guid? ClaimId { get; init; }
    public decimal SubtotalAmount { get; init; }
    public decimal CoveredAmount { get; init; }
    public int DueInDays { get; init; } = 30;
    public List<InvoiceItemInput> Items { get; init; } = new();
}

public record InvoiceItemInput(
    string Description,
    decimal Quantity,
    decimal UnitPrice
);
