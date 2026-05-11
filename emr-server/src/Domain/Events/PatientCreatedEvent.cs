using Domain.Common;
using Domain.Entities;

namespace Domain.Events;

public class PatientCreatedEvent : BaseEvent
{
    public PatientCreatedEvent(Patient patient)
    {
        Patient = patient;
    }

    public Patient Patient { get; }
}
