using Domain.Entities;
using Domain.Enums;
using HotChocolate;
using HotChocolate.Types;

namespace Api.GraphQL.Types;

[ExtendObjectType(typeof(Patient))]
public class PatientType
{
    public string GetVisitStatus([Parent] Patient patient)
    {
        var activeAppointment = patient.Appointments?.FirstOrDefault(a => 
            a.Status == AppointmentStatus.InProgress);
            
        if (activeAppointment != null) return "InProgress";

        var nextAppointment = patient.Appointments?.FirstOrDefault(a => 
            a.Status == AppointmentStatus.Scheduled && 
            a.ScheduledStart > DateTimeOffset.UtcNow);
            
        if (nextAppointment != null) return "Scheduled";

        var latestEncounter = patient.Encounters?.OrderByDescending(e => e.EncounterDate).FirstOrDefault();
        if (latestEncounter != null)
        {
            if (latestEncounter.Status == EncounterStatus.InProgress) return "InProgress";
            if (latestEncounter.Status == EncounterStatus.Completed) return "Completed";
        }

        return "No Visit";
    }
}
