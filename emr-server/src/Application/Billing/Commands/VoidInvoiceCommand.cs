using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Billing.Commands;

public record VoidInvoiceCommand(Guid InvoiceId) : IRequest<bool>;

public class VoidInvoiceCommandHandler : IRequestHandler<VoidInvoiceCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public VoidInvoiceCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<bool> Handle(VoidInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _context.BillingInvoices.FirstOrDefaultAsync(i => i.InvoiceId == request.InvoiceId, cancellationToken);
        if (invoice == null) return false;

        invoice.Status = InvoiceStatus.Cancelled;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
