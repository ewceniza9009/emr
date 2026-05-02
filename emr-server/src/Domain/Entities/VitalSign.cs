using Domain.Common;

namespace Domain.Entities;

public class VitalSign : BaseEntity
{
    public Guid VitalId { get; set; } = Guid.NewGuid();
    public Guid EncounterId { get; set; }
    public decimal? HeartRate { get; set; }
    public decimal? BloodPressureSystolic { get; set; }
    public decimal? BloodPressureDiastolic { get; set; }
    public decimal? RespiratoryRate { get; set; }
    public decimal? Temperature { get; set; }
    public decimal? OxygenSaturation { get; set; }
    public DateTimeOffset RecordedAt { get; set; } = DateTimeOffset.UtcNow;

    public ClinicalEncounter Encounter { get; set; } = null!;
}
