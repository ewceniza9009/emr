using Application.Clinical.Dtos;
using Application.Patients.Dtos;
using Domain.Entities;
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
            .NewConfig<Patient, PatientDto>()
            .Map(dest => dest.Contacts, src => src.Contacts)
            .Map(dest => dest.Documents, src => src.PatientDocuments)
            .Map(dest => dest.Encounters, src => src.Encounters);

        config
            .NewConfig<ClinicalEncounter, ClinicalEncounterDto>()
            .Map(dest => dest.VitalSigns, src => src.VitalSigns)
            .Map(dest => dest.Practitioner, src => src.Practitioner)
            .Map(dest => dest.ClinicalNotes, src => src.ClinicalNotes);
    }
}
