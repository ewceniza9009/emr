using Domain.Enums;

namespace Domain.Entities;

public class EquipmentDelivery
{
    public Guid DeliveryId { get; set; } = Guid.NewGuid();
    public Guid EquipmentId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public DeliveryStatus Status { get; set; } = DeliveryStatus.Pending;
    public DateTimeOffset RequestedAt { get; set; }
    public DateTimeOffset? DeliveredAt { get; set; }
    public string DeliveryAddress { get; set; } = string.Empty;

    public DurableMedicalEquipment Equipment { get; set; } = null!;
    public Patient Patient { get; set; } = null!;
    public ClinicalEncounter? Encounter { get; set; }
}
