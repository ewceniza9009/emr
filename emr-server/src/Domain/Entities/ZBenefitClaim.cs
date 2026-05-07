using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class ZBenefitClaim : BaseEntity, ITenantEntity
{
    public Guid ClaimId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string PhilhealthNumber { get; set; } = string.Empty;
    public string PackageCode { get; set; } = string.Empty;
    public ClaimStatus Status { get; set; } = ClaimStatus.Pending;
    public decimal TotalAmount { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public DateTimeOffset? PaidAt { get; set; }

    public Patient Patient { get; set; } = null!;
    public ICollection<ClaimStatusLog> StatusLogs { get; set; } = new List<ClaimStatusLog>();
}
