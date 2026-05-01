using Domain.Enums;

namespace Domain.Entities;

public enum OutreachMethod
{
    Telephone = 1,
    InPerson = 2,
    Telehealth = 3,
    Email = 4,
    Sms = 5
}

public class OutreachActivity
{
    public Guid ActivityId { get; set; } = Guid.NewGuid();
    public Guid OutreachId { get; set; }
    public Guid PractitionerId { get; set; }
    public OutreachMethod Method { get; set; }
    public string? Outcome { get; set; } // e.g., No Answer, Interested, Scheduled
    public string? Notes { get; set; }
    public DateTimeOffset ActivityDate { get; set; } = DateTimeOffset.UtcNow;
    
    public PatientOutreach Outreach { get; set; } = null!;
    public Practitioner Practitioner { get; set; } = null!;
}
