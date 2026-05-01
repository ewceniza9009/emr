using MediatR;

namespace Application.Clinical.Commands;

public record LogVitalSignCommand(
    Guid EncounterId,
    decimal? HeartRate,
    decimal? BloodPressureSystolic,
    decimal? BloodPressureDiastolic,
    decimal? RespiratoryRate,
    decimal? Temperature,
    decimal? OxygenSaturation
) : IRequest<Guid>;
