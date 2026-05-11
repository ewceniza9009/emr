using Domain.Common;
using Domain.Entities;

namespace Domain.Events;

public class OutreachUpdatedEvent : BaseEvent
{
    public OutreachUpdatedEvent(PatientOutreach outreach)
    {
        Outreach = outreach;
    }

    public PatientOutreach Outreach { get; }
}
