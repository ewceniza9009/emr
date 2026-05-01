using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Patient> Patients { get; }
    DbSet<Practitioner> Practitioners { get; }
    DbSet<Appointment> Appointments { get; }
    DbSet<ScheduleBlock> ScheduleBlocks { get; }
    DbSet<AppointmentResource> AppointmentResources { get; }
    DbSet<CareNavigationCase> CareNavigationCases { get; }
    DbSet<SdohAssessment> SdohAssessments { get; }
    DbSet<NavigationTask> NavigationTasks { get; }
    DbSet<BarrierLog> BarrierLogs { get; }
    DbSet<InterventionLog> InterventionLogs { get; }
    DbSet<ZBenefitClaim> ZBenefitClaims { get; }
    DbSet<ClaimStatusLog> ClaimStatusLogs { get; }
    DbSet<BillingInvoice> BillingInvoices { get; }
    DbSet<ClinicalEncounter> ClinicalEncounters { get; }
    DbSet<Diagnosis> Diagnoses { get; }
    DbSet<Allergy> Allergies { get; }
    DbSet<VitalSign> VitalSigns { get; }
    DbSet<EsasAssessment> EsasAssessments { get; }
    DbSet<ClinicalNote> ClinicalNotes { get; }
    DbSet<DurableMedicalEquipment> DurableMedicalEquipment { get; }
    DbSet<EquipmentDelivery> EquipmentDeliveries { get; }
    DbSet<TelemetryLog> TelemetryLogs { get; }
    DbSet<PractitionerLicensure> PractitionerLicensures { get; }
    DbSet<PractitionerServiceArea> PractitionerServiceAreas { get; }
    DbSet<PatientContact> PatientContacts { get; }
    DbSet<PatientPhone> PatientPhones { get; }
    DbSet<PatientEmail> PatientEmails { get; }
    DbSet<PatientOutreach> PatientOutreaches { get; }
    DbSet<HealthPlan> HealthPlans { get; }
    DbSet<OutreachScript> OutreachScripts { get; }
    DbSet<OutreachActivity> OutreachActivities { get; }
    DbSet<Facility> Facilities { get; }
    DbSet<AdvanceDirective> AdvanceDirectives { get; }
    DbSet<IntegrationProfile> IntegrationProfiles { get; }
    DbSet<Medication> Medications { get; }
    DbSet<Prescription> Prescriptions { get; }
    DbSet<ProviderShift> ProviderShifts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
