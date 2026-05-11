using Domain.Common;
using Domain.Entities;

namespace Domain.Events;

public class PatientUpdatedEvent : BaseEvent
{
    public PatientUpdatedEvent(Patient patient)
    {
        Patient = patient;
    }

    public Patient Patient { get; }
}
