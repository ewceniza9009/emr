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

public class RequestEquipmentDeploymentCommandHandler : IRequestHandler<RequestEquipmentDeploymentCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public RequestEquipmentDeploymentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(RequestEquipmentDeploymentCommand request, CancellationToken cancellationToken)
    {
        var equipment = await _context.DurableMedicalEquipment
            .FirstOrDefaultAsync(e => e.EquipmentId == request.EquipmentId, cancellationToken);

        if (equipment == null) throw new Exception("Equipment not found.");
        if (equipment.Status != EquipmentStatus.Available) throw new Exception("Equipment is not available for deployment.");

        var delivery = new EquipmentDelivery
        {
            EquipmentId = request.EquipmentId,
            PatientId = request.PatientId,
            DeliveryAddress = request.DeliveryAddress,
            Status = DeliveryStatus.Pending,
            RequestedAt = DateTimeOffset.UtcNow
        };

        // Update equipment status to reflect it's being deployed
        equipment.Status = EquipmentStatus.InUse;

        _context.EquipmentDeliveries.Add(delivery);
        await _context.SaveChangesAsync(cancellationToken);

        return delivery.DeliveryId;
    }
}
