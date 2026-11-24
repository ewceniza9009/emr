using Application.Billing.Dtos;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

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
        var invoiceCount = await _context
            .BillingInvoices.AsNoTracking()
            .CountAsync(cancellationToken);
        var invoiceNumber = $"INV-{_dateTime.UtcNow:yyyyMM}-{invoiceCount + 1:D4}";
        if (
            await _context
                .BillingInvoices.AsNoTracking()
                .AnyAsync(i => i.InvoiceNumber == invoiceNumber, cancellationToken)
        )
        {
            invoiceNumber =
                $"INV-{_dateTime.UtcNow:yyyyMM}-{invoiceCount + 1:D4}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}";
        }

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
            DueDate = _dateTime.UtcNow.AddDays(request.DueInDays),
            Items = request.Items.Select(i => new BillingInvoiceItem
            {
                ItemId = Guid.NewGuid(),
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.Quantity * i.UnitPrice
            }).ToList()
        };

        _context.BillingInvoices.Add(invoice);
        await _context.SaveChangesAsync(cancellationToken);

        return invoice.Adapt<BillingInvoiceDto>();
    }
}
