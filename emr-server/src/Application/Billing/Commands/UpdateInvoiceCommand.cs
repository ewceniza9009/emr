using Application.Billing.Dtos;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Billing.Commands;

public record UpdateInvoiceCommand : IRequest<BillingInvoiceDto>
{
    public Guid InvoiceId { get; init; }
    public decimal SubtotalAmount { get; init; }
    public decimal CoveredAmount { get; init; }
    public int DueInDays { get; init; } = 30;
}

public class UpdateInvoiceCommandHandler : IRequestHandler<UpdateInvoiceCommand, BillingInvoiceDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public UpdateInvoiceCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<BillingInvoiceDto> Handle(UpdateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _context.BillingInvoices.FirstOrDefaultAsync(i => i.InvoiceId == request.InvoiceId, cancellationToken);
        if (invoice == null) return null!;

        invoice.SubtotalAmount = request.SubtotalAmount;
        invoice.CoveredAmount = request.CoveredAmount;
        invoice.PatientResponsibility = request.SubtotalAmount - request.CoveredAmount;
        invoice.DueDate = invoice.GeneratedAt.AddDays(request.DueInDays);

        await _context.SaveChangesAsync(cancellationToken);
        
        // Manual mapping or adapt
        return new BillingInvoiceDto(
            invoice.InvoiceId,
            invoice.PatientId,
            invoice.EncounterId,
            invoice.ClaimId,
            invoice.InvoiceNumber,
            invoice.Status,
            invoice.SubtotalAmount,
            invoice.CoveredAmount,
            invoice.PatientResponsibility,
            invoice.GeneratedAt,
            invoice.DueDate
        );
    }
}
