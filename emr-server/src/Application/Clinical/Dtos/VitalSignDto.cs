namespace Application.Clinical.Dtos;

public class VitalSignDto
{
    public Guid VitalId { get; set; }
    public Guid EncounterId { get; set; }
    public decimal? HeartRate { get; set; }
    public decimal? BloodPressureSystolic { get; set; }
    public decimal? BloodPressureDiastolic { get; set; }
    public decimal? RespiratoryRate { get; set; }
    public decimal? Temperature { get; set; }
    public decimal? OxygenSaturation { get; set; }
    public decimal? Weight { get; set; }
    public DateTimeOffset RecordedAt { get; set; }
}
