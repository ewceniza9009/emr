using Application.Billing.Dtos;
using MediatR;

namespace Application.Billing.Commands;

public record CreateInvoiceCommand : IRequest<BillingInvoiceDto>
{
    public Guid PatientId { get; init; }
    public Guid? EncounterId { get; init; }
    public decimal SubtotalAmount { get; init; }
    public decimal CoveredAmount { get; init; }
    public int DueInDays { get; init; } = 30;
}
