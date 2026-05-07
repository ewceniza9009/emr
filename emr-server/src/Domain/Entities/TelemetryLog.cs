using Domain.Common;

namespace Domain.Entities;

public class TelemetryLog : BaseEntity, ITenantEntity
{
    public Guid LogId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid EquipmentId { get; set; }

    // Generic JSON or specific fields for sensor data
    // Here we use specific fields for common palliative telemetry (e.g. Oxygen Level)
    public string SensorType { get; set; } = string.Empty; // e.g. 'O2_Level', 'Battery_Status'
    public decimal Value { get; set; }
    public string Unit { get; set; } = string.Empty; // e.g. '%', 'psi', 'V'
    public DateTimeOffset RecordedAt { get; set; }

    public DurableMedicalEquipment Equipment { get; set; } = null!;
}
