using Domain.Enums;
using Application.Patients.Dtos;
using System.Collections.Generic;

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
    DateTimeOffset? PaidAt,
    PatientDto? Patient = null,
    ICollection<ClaimStatusLogDto>? StatusLogs = null
);

public record ClaimStatusLogDto(
    Guid LogId,
    ClaimStatus PreviousStatus,
    ClaimStatus NewStatus,
    string ChangedBy,
    string? Remarks,
    DateTimeOffset ChangedAt
);
