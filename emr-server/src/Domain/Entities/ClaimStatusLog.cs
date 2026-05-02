using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class ClaimStatusLog : BaseEntity
{
    public Guid LogId { get; set; } = Guid.NewGuid();
    public Guid ClaimId { get; set; }
    public ClaimStatus PreviousStatus { get; set; }
    public ClaimStatus NewStatus { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
    public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;

    public ZBenefitClaim Claim { get; set; } = null!;
}
