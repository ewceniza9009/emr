using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class DurableMedicalEquipment : BaseEntity, ITenantEntity
{
    public Guid EquipmentId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string ModelName { get; set; } = string.Empty;
    public EquipmentType Type { get; set; }
    public EquipmentStatus Status { get; set; } = EquipmentStatus.Available;
    public DateTimeOffset LastMaintenanceDate { get; set; }
    
    public ICollection<EquipmentDelivery> Deliveries { get; set; } = new List<EquipmentDelivery>();
    public ICollection<TelemetryLog> TelemetryLogs { get; set; } = new List<TelemetryLog>();
}
