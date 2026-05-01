using MediatR;

namespace Application.Billing.Commands;

public record SubmitZBenefitClaimCommand(
    Guid PatientId,
    string PhilhealthNumber,
    string PackageCode,
    decimal TotalAmount
) : IRequest<Guid>;
