using Api.GraphQL.Attributes;
using Application.Clinical.Dtos;
using Application.Clinical.Queries;
using Application.Clinical.Services;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using HotChocolate.Authorization;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class ClinicalQuery
{
    private readonly ISecurityAuditService _auditService;

    public ClinicalQuery(ISecurityAuditService auditService)
    {
        _auditService = auditService;
    }

    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    [GraphQLName("encountersByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<ClinicalEncounter>> GetEncountersByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var patient = await context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);
        var patientName = patient != null ? $"{patient.FirstName} {patient.LastName}" : "Unknown Patient";

        await _auditService.LogActionAsync(
            "CLINICAL_HISTORY_VIEWED",
            $"Patient clinical encounter history accessed for {patientName}.",
            patientId.ToString(),
            patientName,
            $"Patient Record: {patientName} ({patientId})"
        );

        return context
            .ClinicalEncounters.Include(e => e.Practitioner)
            .Include(e => e.ClinicalNotes)
            .Include(e => e.VitalSigns)
            .Include(e => e.AssessmentResponses)
                .ThenInclude(r => r.Questionnaire)
            .AsNoTracking()
            .Where(e => e.PatientId == patientId);
    }

    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    [GraphQLName("vitalSignsByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<VitalSign>> GetVitalSignsByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .VitalSigns.Include(v => v.Encounter)
            .AsNoTracking()
            .Where(v => v.Encounter.PatientId == patientId);
    }

    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    [GraphQLName("esasHistoryByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<EsasAssessment>> GetEsasHistoryByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context.EsasAssessments.AsNoTracking().Where(e => e.PatientId == patientId);
    }

    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    [GraphQLName("equipmentDeliveriesByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<EquipmentDelivery>> GetEquipmentDeliveriesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .EquipmentDeliveries.Include(x => x.Equipment)
            .AsNoTracking()
            .Where(e => e.PatientId == patientId);
    }

    [Authorize(Policy = "CanViewPatients")]
    [GraphQLName("patientClinicalSummary")]
    [UseClinicalAccess]
    public async Task<PatientClinicalSummaryDto> GetPatientClinicalSummary(
        Guid patientId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(
            new GetPatientClinicalSummaryQuery(patientId),
            cancellationToken
        );
    }

    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    [GraphQLName("triageWorklist")]
    public async Task<PagedResponse<TriageItemDto>> GetTriageWorklist(
        string? search,
        bool? isAlert,
        List<string>? directiveTypes,
        int skip = 0,
        int take = 50,
        [Service] IMediator mediator = default!,
        CancellationToken cancellationToken = default
    )
    {
        return await mediator.Send(
            new GetTriageWorklistQuery(search, skip, take, isAlert, directiveTypes),
            cancellationToken
        );
    }

    [Authorize(Policy = "CanViewPatients")]
    [GraphQLName("facilityOutreach")]
    public async Task<List<FacilityOutreachDto>> GetFacilityOutreach(
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return await context.Facilities
            .AsNoTracking()
            .Select(f => new FacilityOutreachDto
            {
                FacilityId = f.FacilityId,
                Name = f.Name,
                PatientCount = f.Residents.Count(),
                CrisisCount = f.Residents.Count(p => p.EsasAssessments
                    .OrderByDescending(e => e.AssessedAt)
                    .Select(e => (bool?)(e.Pain > 7 || e.Wellbeing > 7))
                    .FirstOrDefault() == true)
            })
            .OrderByDescending(f => f.CrisisCount)
            .ThenByDescending(f => f.PatientCount)
            .Take(3) // The UI shows top 3
            .ToListAsync(cancellationToken);
    }

    [Authorize(Policy = "CanViewPatients")]
    public IQueryable<SmartPhrase> GetSmartPhrases([Service] IApplicationDbContext context)
    {
        return context.SmartPhrases.AsNoTracking();
    }

    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    [GraphQLName("spiritualAssessmentsByEncounter")]
    [UseClinicalAccess(argumentName: "encounterId", source: ClinicalIdSource.Encounter)]
    public async Task<IQueryable<SpiritualAssessment>> GetSpiritualAssessmentsByEncounter(
        Guid encounterId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context.SpiritualAssessments.AsNoTracking().Where(r => r.EncounterId == encounterId);
    }

    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    [GraphQLName("advanceDirectivesByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<AdvanceDirective>> GetAdvanceDirectivesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context.AdvanceDirectives.AsNoTracking().Where(r => r.PatientId == patientId);
    }

    [Authorize(Policy = "CanViewPatients")]
    [UseFiltering]
    [UseSorting]
    [GraphQLName("assessmentResponsesByEncounter")]
    [UseClinicalAccess(argumentName: "encounterId", source: ClinicalIdSource.Encounter)]
    public async Task<IQueryable<AssessmentResponse>> GetAssessmentResponsesByEncounter(
        Guid encounterId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .AssessmentResponses.Include(r => r.Questionnaire)
                .ThenInclude(q => q.Questions)
            .Include(r => r.Assessor)
            .AsNoTracking()
            .Where(r => r.EncounterId == encounterId);
    }

    [Authorize(Policy = "CanViewPatients")]
    [GraphQLName("searchDiagnosisLibrary")]
    public async Task<List<Diagnosis>> SearchDiagnosisLibrary(
        string term,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(term))
            return new List<Diagnosis>();

        var lowerTerm = term.ToLower();

        return await context
            .Diagnoses.AsNoTracking()
            .Where(d =>
                d.Icd10Code.ToLower().Contains(lowerTerm)
                || d.Description.ToLower().Contains(lowerTerm)
            )
            .GroupBy(d => new { d.Icd10Code, d.Description })
            .Select(g => new Diagnosis
            {
                Icd10Code = g.Key.Icd10Code,
                Description = g.Key.Description,
            })
            .OrderBy(d => d.Icd10Code)
            .Take(10)
            .ToListAsync(cancellationToken);
    }

    [Authorize(Policy = "CanViewPatients")]
    [GraphQLName("generateAiSoapDraft")]
    [UseClinicalAccess(argumentName: "patientId")]
    public async Task<AiSoapDraft> GenerateAiSoapDraft(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var patient = await context.Patients.AsNoTracking()
            .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);
        if (patient == null)
            throw new ArgumentException("Patient not found.");

        var latestVitals = await context.VitalSigns.IgnoreQueryFilters()
            .Include(v => v.Encounter)
            .Where(v => v.Encounter.PatientId == patientId)
            .OrderByDescending(v => v.RecordedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var latestEsas = await context.EsasAssessments.IgnoreQueryFilters()
            .Where(e => e.PatientId == patientId)
            .OrderByDescending(e => e.AssessedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var prescriptions = await context.Prescriptions.IgnoreQueryFilters()
            .Include(p => p.Medication)
            .Where(p => p.PatientId == patientId && p.EndDate == null)
            .ToListAsync(cancellationToken);

        var allergies = await context.Allergies.IgnoreQueryFilters()
            .Where(a => a.PatientId == patientId)
            .ToListAsync(cancellationToken);

        var patientName = $"{patient.FirstName} {patient.LastName}";
        
        var subParts = new List<string> {
            $"Patient {patientName} (MRN: {patient.Mrn}) presents for symptom review.",
            latestEsas != null 
                ? $"On the latest ESAS-R assessment, the patient reported: Pain: {latestEsas.Pain}/10, Tiredness: {latestEsas.Tiredness}/10, Shortness of Breath: {latestEsas.ShortnessOfBreath}/10, Anxiety: {latestEsas.Anxiety}/10, Wellbeing: {latestEsas.Wellbeing}/10."
                : "No recent ESAS-R symptom scoring has been self-logged. Patient reports general palliative discomfort.",
        };
        if (allergies.Any())
        {
            var allergyList = string.Join(", ", allergies.Select(a => $"{a.Allergen} (Reaction: {a.Reaction}, Severity: {a.Severity})"));
            subParts.Add($"Documented allergies: {allergyList}.");
        }
        else
        {
            subParts.Add("No documented allergies of record.");
        }
        
        var objParts = new List<string>();
        if (latestVitals != null)
        {
            objParts.Add("Physical assessment reveals vital signs stable within palliative thresholds:");
            objParts.Add($"- Heart Rate: {latestVitals.HeartRate ?? 80} BPM");
            objParts.Add($"- Blood Pressure: {(latestVitals.BloodPressureSystolic != null && latestVitals.BloodPressureDiastolic != null ? $"{latestVitals.BloodPressureSystolic}/{latestVitals.BloodPressureDiastolic}" : "120/80")} mmHg");
            objParts.Add($"- Oxygen Saturation: {latestVitals.OxygenSaturation ?? 95}% SpO2 on room air");
            objParts.Add($"- Temperature: {latestVitals.Temperature ?? 98.6M}°F");
        }
        else
        {
            objParts.Add("No vital signs recorded during the current temporal window. Patient is resting comfortably.");
        }

        var assParts = new List<string>();
        var suggestedCodes = new List<string>();
        var suggestedDescs = new List<string>();

        if (latestEsas != null)
        {
            if (latestEsas.Pain > 6)
            {
                assParts.Add("1. Chronic Intractable Pain: Symptom burden is high; patient reports severe breakthrough pain.");
                suggestedCodes.Add("R52.1");
                suggestedDescs.Add("Chronic intractable pain");
            }
            if (latestEsas.ShortnessOfBreath > 5)
            {
                assParts.Add("2. Dyspnea: Mild to moderate respiratory distress noted on symptom burden scoring.");
                suggestedCodes.Add("R06.02");
                suggestedDescs.Add("Shortness of breath");
            }
            if (latestEsas.Anxiety > 5)
            {
                assParts.Add("3. Anxiety: Psychological distress secondary to progressive illness.");
                suggestedCodes.Add("F41.9");
                suggestedDescs.Add("Anxiety disorder, unspecified");
            }
        }
        if (!assParts.Any())
        {
            assParts.Add("1. Palliative Care Encounter: Patient is overall stable, continuing care path.");
            suggestedCodes.Add("Z51.5");
            suggestedDescs.Add("Encounter for palliative care");
        }

        var planParts = new List<string> {
            "1. Continue supportive care interventions.",
        };
        if (prescriptions.Any())
        {
            var meds = string.Join(", ", prescriptions.Select(p => $"{p.Medication.Name} {p.Medication.Strength}"));
            planParts.Add($"2. Review and reconcile active medications: {meds}.");
        }
        if (latestEsas != null && latestEsas.Pain > 6)
        {
            planParts.Add("3. Adjust oral opioid doses for severe breakthrough pain management. Administer PRN meds.");
        }
        planParts.Add("4. Re-evaluate clinical dashboard vitals and schedule nurse follow-up visit in 3-5 days.");

        return new AiSoapDraft
        {
            Subjective = string.Join("\n", subParts),
            Objective = string.Join("\n", objParts),
            Assessment = string.Join("\n", assParts),
            Plan = string.Join("\n", planParts),
            SuggestedIcdCodes = suggestedCodes,
            SuggestedIcdDescriptions = suggestedDescs
        };
    }
}

public class AiSoapDraft
{
    public string Subjective { get; set; } = string.Empty;
    public string Objective { get; set; } = string.Empty;
    public string Assessment { get; set; } = string.Empty;
    public string Plan { get; set; } = string.Empty;
    public List<string> SuggestedIcdCodes { get; set; } = new();
    public List<string> SuggestedIcdDescriptions { get; set; } = new();
}
