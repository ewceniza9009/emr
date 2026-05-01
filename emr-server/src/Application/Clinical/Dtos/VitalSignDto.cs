namespace Application.Clinical.Dtos;

public record VitalSignDto(
    Guid VitalId,
    Guid EncounterId,
    decimal? HeartRate,
    decimal? BloodPressureSystolic,
    decimal? BloodPressureDiastolic,
    decimal? RespiratoryRate,
    decimal? Temperature,
    decimal? OxygenSaturation,
    DateTimeOffset RecordedAt
);
