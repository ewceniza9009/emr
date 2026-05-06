using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Logistics.Commands;

public record UpdateDeploymentStatusCommand : IRequest<bool>
{
    public Guid DeliveryId { get; init; }
    public DeliveryStatus NewStatus { get; init; }
}

public class UpdateDeploymentStatusCommandHandler : IRequestHandler<UpdateDeploymentStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateDeploymentStatusCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateDeploymentStatusCommand request, CancellationToken cancellationToken)
    {
        var delivery = await _context.EquipmentDeliveries
            .FirstOrDefaultAsync(d => d.DeliveryId == request.DeliveryId, cancellationToken);

        if (delivery == null) return false;

        delivery.Status = request.NewStatus;
        if (request.NewStatus == DeliveryStatus.Delivered)
        {
            delivery.DeliveredAt = DateTimeOffset.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
