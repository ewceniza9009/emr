using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public enum OutreachMethod
{
    Telephone,
    InPerson,
    Telehealth,
    Email,
    Sms
}

public class OutreachActivity : BaseEntity, ITenantEntity
{
    public Guid OutreachActivityId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid OutreachId { get; set; }
    public Guid PractitionerId { get; set; }
    public OutreachMethod Method { get; set; }
    public string? Outcome { get; set; } // e.g., No Answer, Interested, Scheduled
    public string? Reason { get; set; } // e.g., Not interested, busy, DNC request
    public string? Notes { get; set; }
    public DateTimeOffset ActivityDate { get; set; } = DateTimeOffset.UtcNow;
    
    public PatientOutreach Outreach { get; set; } = null!;
    public Practitioner Practitioner { get; set; } = null!;
}
