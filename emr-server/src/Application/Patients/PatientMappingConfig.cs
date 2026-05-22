using Application.Clinical.Dtos;
using Application.Patients.Dtos;
using Domain.Entities;
using Domain.Enums;
using Mapster;

namespace Application.Patients;

public class PatientMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config
            .NewConfig<PatientContact, PatientContactDto>()
            .Map(dest => dest.PatientContactId, src => src.ContactId)
            .Map(dest => dest.Phone, src => src.PhoneNumber)
            .Map(dest => dest.IsPoa, src => src.HasPowerOfAttorney);

        config
            .NewConfig<AdvanceDirective, AdvanceDirectiveDto>();

        config
            .NewConfig<Patient, PatientDto>()
            .Map(dest => dest.Contacts, src => src.Contacts)
            .Map(dest => dest.Documents, src => src.PatientDocuments)
            .Map(dest => dest.Encounters, src => src.Encounters)
            .Map(dest => dest.VisitStatus, src => src.Appointments
                .Where(a => a.Status != AppointmentStatus.Cancelled)
                .OrderByDescending(a => a.ScheduledStart)
                .Select(a => a.Status.ToString())
                .FirstOrDefault() ?? "No Visit")
            .Map(dest => dest.PrimaryCareNavigatorName, src => src.CareNavigationCases
                .Where(c => c.Status == CaseStatus.Open)
                .OrderByDescending(c => c.OpenedAt)
                .Select(c => c.Navigator.FirstName + " " + c.Navigator.LastName)
                .FirstOrDefault() ?? "Erwin Wilson Ceniza")
            .Map(dest => dest.HasAdvanceDirective, src => src.HasAdvanceDirective)
            .Map(dest => dest.AdvanceDirectives, src => src.AdvanceDirectives);

        config
            .NewConfig<ClinicalEncounter, ClinicalEncounterDto>()
            .Map(dest => dest.VitalSigns, src => src.VitalSigns)
            .Map(dest => dest.Practitioner, src => src.Practitioner)
            .Map(dest => dest.ClinicalNotes, src => src.ClinicalNotes);

        config
            .NewConfig<Patient, TriageItemDto>()
            .Map(dest => dest.LatestPainScore, src => src.EsasAssessments
                .OrderByDescending(e => e.AssessedAt)
                .Select(e => e.Pain)
                .FirstOrDefault())
            .Map(dest => dest.LatestWellbeingScore, src => src.EsasAssessments
                .OrderByDescending(e => e.AssessedAt)
                .Select(e => e.Wellbeing)
                .FirstOrDefault())
            .Map(dest => dest.AdvanceDirectiveType, src => src.AdvanceDirectives
                .Where(ad => ad.IsActive)
                .OrderByDescending(ad => ad.CreatedAt)
                .Select(ad => ad.Type.ToString())
                .FirstOrDefault() ?? "None")
            .Map(dest => dest.IsAlert, src => 
                (src.TriageNote == null || !src.TriageNote.Contains("Claimed")) && 
                (src.EsasAssessments
                    .OrderByDescending(e => e.AssessedAt)
                    .Select(e => (bool?)(e.Pain > 7 || e.Wellbeing > 7))
                    .FirstOrDefault() == true
                 || src.CareNavigationCases.Any(c => c.AcuityLevel == AcuityLevel.Critical && c.Status == CaseStatus.Open))
            );
    }
}
