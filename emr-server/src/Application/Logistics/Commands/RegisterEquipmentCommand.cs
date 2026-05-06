using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Application.Logistics.Commands;

public record RegisterEquipmentCommand : IRequest<Guid>
{
    public string SerialNumber { get; init; } = string.Empty;
    public string ModelName { get; init; } = string.Empty;
    public EquipmentType Type { get; init; }
}

public class RegisterEquipmentCommandHandler : IRequestHandler<RegisterEquipmentCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public RegisterEquipmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(RegisterEquipmentCommand request, CancellationToken cancellationToken)
    {
        var entity = new DurableMedicalEquipment
        {
            SerialNumber = request.SerialNumber,
            ModelName = request.ModelName,
            Type = request.Type,
            Status = EquipmentStatus.Available,
            LastMaintenanceDate = DateTimeOffset.UtcNow
        };

        _context.DurableMedicalEquipment.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return entity.EquipmentId;
    }
}
