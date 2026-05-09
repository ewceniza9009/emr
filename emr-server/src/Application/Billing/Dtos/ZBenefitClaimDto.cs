using Domain.Enums;
using Application.Patients.Dtos;
using System.Collections.Generic;

namespace Application.Billing.Dtos;

public class ZBenefitClaimDto
{
    public Guid ClaimId { get; set; }
    public Guid PatientId { get; set; }
    public string PhilhealthNumber { get; set; } = string.Empty;
    public string PackageCode { get; set; } = string.Empty;
    public ClaimStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public PatientDto? Patient { get; set; }
    public ICollection<ClaimStatusLogDto>? StatusLogs { get; set; }
}

public class ClaimStatusLogDto
{
    public Guid LogId { get; set; }
    public ClaimStatus PreviousStatus { get; set; }
    public ClaimStatus NewStatus { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
}
