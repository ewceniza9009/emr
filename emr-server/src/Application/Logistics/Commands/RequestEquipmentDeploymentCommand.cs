using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Logistics.Commands;

public record RequestEquipmentDeploymentCommand : IRequest<Guid>
{
    public Guid EquipmentId { get; init; }
    public Guid PatientId { get; init; }
    public string DeliveryAddress { get; init; } = string.Empty;
}

public class RequestEquipmentDeploymentCommandHandler
    : IRequestHandler<RequestEquipmentDeploymentCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public RequestEquipmentDeploymentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(
        RequestEquipmentDeploymentCommand request,
        CancellationToken cancellationToken
    )
    {
        var equipment = await _context.DurableMedicalEquipment.FirstOrDefaultAsync(
            e => e.EquipmentId == request.EquipmentId,
            cancellationToken
        );

        if (equipment == null) throw new InvalidOperationException("The requested medical equipment could not be located in our active inventory.");
        if (equipment.Status != EquipmentStatus.Available) throw new InvalidOperationException($"Deployment failed: This equipment is currently marked as '{equipment.Status}'. Please select an available unit.");

        var delivery = new EquipmentDelivery
        {
            EquipmentId = request.EquipmentId,
            PatientId = request.PatientId,
            DeliveryAddress = request.DeliveryAddress,
            Status = DeliveryStatus.Pending,
            RequestedAt = DateTimeOffset.UtcNow,
        };

        // Update equipment status to reflect it's being deployed
        equipment.Status = EquipmentStatus.InUse;

        _context.EquipmentDeliveries.Add(delivery);

        // --- AUTOMATED BILLING WORKFLOW ---
        // Find or create an active invoice for this patient
        var activeInvoice = await _context.BillingInvoices.FirstOrDefaultAsync(
            i => i.PatientId == request.PatientId && i.Status == InvoiceStatus.Draft,
            cancellationToken
        );

        if (activeInvoice == null)
        {
            activeInvoice = new BillingInvoice
            {
                PatientId = request.PatientId,
                Status = InvoiceStatus.Draft,
                GeneratedAt = DateTimeOffset.UtcNow,
                DueDate = DateTimeOffset.UtcNow.AddDays(30),
                SubtotalAmount = 0,
            };
            _context.BillingInvoices.Add(activeInvoice);
        }

        // Add the equipment deployment fee/rental item
        var billingItem = new BillingInvoiceItem
        {
            InvoiceId = activeInvoice.InvoiceId,
            Description =
                $"Medical Equipment Deployment: {equipment.ModelName} ({equipment.SerialNumber})",
            UnitPrice = 150.00m, // Standard base deployment & rental fee
            Quantity = 1,
            TotalPrice = 150.00m,
        };

        activeInvoice.SubtotalAmount += billingItem.TotalPrice;
        _context.BillingInvoiceItems.Add(billingItem);
        // ----------------------------------

        await _context.SaveChangesAsync(cancellationToken);

        return delivery.DeliveryId;
    }
}
