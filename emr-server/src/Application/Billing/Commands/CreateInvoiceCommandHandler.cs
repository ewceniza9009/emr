using Application.Billing.Dtos;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Mapster;
using MediatR;

namespace Application.Billing.Commands;

public class CreateInvoiceCommandHandler : IRequestHandler<CreateInvoiceCommand, BillingInvoiceDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public CreateInvoiceCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<BillingInvoiceDto> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoiceCount = _context.BillingInvoices.Count();
        var invoiceNumber = $"INV-{_dateTime.UtcNow:yyyyMM}-{invoiceCount + 1:D4}";

        var invoice = new BillingInvoice
        {
            InvoiceId = Guid.NewGuid(),
            PatientId = request.PatientId,
            EncounterId = request.EncounterId,
            InvoiceNumber = invoiceNumber,
            Status = InvoiceStatus.Draft,
            SubtotalAmount = request.SubtotalAmount,
            CoveredAmount = request.CoveredAmount,
            PatientResponsibility = request.SubtotalAmount - request.CoveredAmount,
            GeneratedAt = _dateTime.UtcNow,
            DueDate = _dateTime.UtcNow.AddDays(request.DueInDays)
        };

        _context.BillingInvoices.Add(invoice);
        await _context.SaveChangesAsync(cancellationToken);

        return invoice.Adapt<BillingInvoiceDto>();
    }
}
