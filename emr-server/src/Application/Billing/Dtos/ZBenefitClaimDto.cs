using Domain.Enums;

namespace Application.Billing.Dtos;

public record ZBenefitClaimDto(
    Guid ClaimId,
    Guid PatientId,
    string PhilhealthNumber,
    string PackageCode,
    ClaimStatus Status,
    decimal TotalAmount,
    DateTimeOffset CreatedAt,
    DateTimeOffset? SubmittedAt,
    DateTimeOffset? ApprovedAt,
    DateTimeOffset? PaidAt
);
