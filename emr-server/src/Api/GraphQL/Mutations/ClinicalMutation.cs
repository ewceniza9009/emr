using Application.Clinical.Commands;
using Application.Common.Interfaces;
using Application.Patients.Commands;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Api.GraphQL.Attributes;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanChart")]
public class ClinicalMutation
{
    [GraphQLName("createClinicalEncounter")]
    [UseClinicalAccess(argumentName: "PatientId")]
    public async Task<Guid> CreateClinicalEncounter(
        CreateClinicalEncounterCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        var command = new CreateClinicalEncounterCommand
        {
            PatientId = input.PatientId,
            PractitionerId = input.PractitionerId,
            AppointmentId = input.AppointmentId,
            ChiefComplaint = input.ChiefComplaint,
            Notes = input.Notes,
            PpsScore = input.PpsScore
        };

        var result = await mediator.Send(command, cancellationToken);
        await auditService.LogActionAsync(
            "CLINICAL_ENCOUNTER_STARTED",
            $"Encounter started for patient. Complaint: {input.ChiefComplaint}",
            input.PatientId.ToString()
        );
        return result;
    }

    [GraphQLName("addAllergy")]
    [UseClinicalAccess(argumentName: "PatientId")]
    public async Task<Guid> AddAllergy(
        AddAllergyCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        var command = new AddAllergyCommand
        {
            PatientId = input.PatientId,
            Allergen = input.Allergen,
            Reaction = input.Reaction,
            Severity = input.Severity,
            IdentifiedAt = input.IdentifiedAt ?? DateTimeOffset.UtcNow,
        };

        var result = await mediator.Send(command, cancellationToken);
        await auditService.LogActionAsync(
            "PATIENT_ALLERGY_ADDED",
            $"Allergy recorded: {input.Allergen}",
            input.PatientId.ToString()
        );
        return result;
    }

    [GraphQLName("logVitalSign")]
    [UseClinicalAccess(argumentName: "EncounterId", source: ClinicalIdSource.Encounter)]
    public async Task<Guid> LogVitalSign(
        LogVitalSignCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        var command = new LogVitalSignCommand(
            input.EncounterId,
            input.HeartRate,
            input.BloodPressureSystolic,
            input.BloodPressureDiastolic,
            input.RespiratoryRate,
            input.Temperature,
            input.OxygenSaturation,
            input.Weight
        );

        var result = await mediator.Send(command, cancellationToken);
        
        await auditService.LogActionAsync(
            "PATIENT_VITALS_LOGGED",
            "Vital signs recorded during encounter.",
            input.EncounterId.ToString()
        );
        return result;
    }

    [GraphQLName("completeGuidedEncounter")]
    [UseClinicalAccess(argumentName: "EncounterId", source: ClinicalIdSource.Encounter)]
    public async Task<Guid> CompleteGuidedEncounter(
        CompleteGuidedEncounterCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        var command = new CompleteGuidedEncounterCommand
        {
            EncounterId = input.EncounterId,
            Type = input.Type,
            PpsScore = input.PpsScore,
            Subjective = input.Subjective,
            Objective = input.Objective,
            Assessment = input.Assessment,
            Plan = input.Plan,
            Pain = input.Pain,
            Tiredness = input.Tiredness,
            Drowsiness = input.Drowsiness,
            Nausea = input.Nausea,
            LackOfAppetite = input.LackOfAppetite,
            ShortnessOfBreath = input.ShortnessOfBreath,
            Depression = input.Depression,
            Anxiety = input.Anxiety,
            Wellbeing = input.Wellbeing,
        };

        var result = await mediator.Send(command, cancellationToken);
        await auditService.LogActionAsync(
            "CLINICAL_ENCOUNTER_COMPLETED",
            "Guided encounter finalized.",
            input.EncounterId.ToString()
        );
        return result;
    }

    [GraphQLName("addPrescription")]
    [UseClinicalAccess(argumentName: "PatientId")]
    public async Task<Guid> AddPrescription(
        AddPrescriptionCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        var command = new AddPrescriptionCommand
        {
            PatientId = input.PatientId,
            MedicationName = input.MedicationName,
            Strength = input.Strength,
            Dose = input.Dose,
            Frequency = input.Frequency,
            Route = input.Route,
            Indications = input.Indications,
            StartDate = input.StartDate ?? DateTimeOffset.UtcNow,
            DigitalSignature = input.DigitalSignature ?? "SIGNED_BY_PROVIDER",
        };

        var result = await mediator.Send(command, cancellationToken);
        await auditService.LogActionAsync(
            "PATIENT_MEDICATION_PRESCRIBED",
            $"Prescription created: {input.MedicationName}",
            input.PatientId.ToString()
        );
        return result;
    }

    [GraphQLName("logAssessmentResponse")]
    [UseClinicalAccess(argumentName: "PatientId")]
    public async Task<Guid> LogAssessmentResponse(
        LogAssessmentResponseCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        var command = new LogAssessmentResponseCommand
        {
            QuestionnaireId = input.QuestionnaireId,
            PatientId = input.PatientId,
            EncounterId = input.EncounterId,
            AssessorId = input.AssessorId,
            AnswersJson = input.AnswersJson,
            TotalScore = input.TotalScore,
        };

        var result = await mediator.Send(command, cancellationToken);
        await auditService.LogActionAsync(
            "CLINICAL_ASSESSMENT_LOGGED",
            $"Assessment response recorded. Score: {input.TotalScore}",
            input.PatientId.ToString()
        );
        return result;
    }

    [GraphQLName("saveClinicalNote")]
    [UseClinicalAccess(argumentName: "EncounterId", source: ClinicalIdSource.Encounter)]
    public async Task<Guid> SaveClinicalNote(
        SaveClinicalNoteCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        var command = new SaveClinicalNoteCommand
        {
            EncounterId = input.EncounterId,
            AuthorId = input.AuthorId,
            Subjective = input.Subjective,
            Objective = input.Objective,
            Assessment = input.Assessment,
            Plan = input.Plan,
            Content = input.Content,
            Signature = input.Signature,
        };

        var result = await mediator.Send(command, cancellationToken);
        await auditService.LogActionAsync(
            "CLINICAL_NOTE_SAVED",
            "Clinical encounter note updated/signed.",
            input.EncounterId.ToString()
        );
        return result;
    }

    [GraphQLName("addDiagnosis")]
    [UseClinicalAccess(argumentName: "PatientId")]
    public async Task<Guid> AddDiagnosis(
        AddDiagnosisCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        var command = new AddDiagnosisCommand(
            input.PatientId,
            input.Icd10Code,
            input.Description,
            input.IsPrimary,
            input.DiagnosedAt
        );

        var result = await mediator.Send(command, cancellationToken);
        await auditService.LogActionAsync(
            "PATIENT_DIAGNOSIS_RECORDED",
            $"Diagnosis added: {input.Icd10Code} - {input.Description}",
            input.PatientId.ToString()
        );
        return result;
    }
}

public record AddAllergyCommandInput(
    Guid PatientId,
    string Allergen,
    string Reaction,
    SeverityLevel Severity,
    DateTimeOffset? IdentifiedAt
);

public record LogVitalSignCommandInput(
    Guid EncounterId,
    decimal? HeartRate,
    decimal? BloodPressureSystolic,
    decimal? BloodPressureDiastolic,
    decimal? RespiratoryRate,
    decimal? Temperature,
    decimal? OxygenSaturation,
    decimal? Weight
);

public record CompleteGuidedEncounterCommandInput(
    Guid EncounterId,
    EncounterType Type,
    int PpsScore,
    string Subjective,
    string Objective,
    string Assessment,
    string Plan,
    int Pain,
    int Tiredness,
    int Drowsiness,
    int Nausea,
    int LackOfAppetite,
    int ShortnessOfBreath,
    int Depression,
    int Anxiety,
    int Wellbeing
);

public record AddPrescriptionCommandInput(
    Guid PatientId,
    string MedicationName,
    string Strength,
    string Dose,
    string Frequency,
    MedicationRoute Route,
    string? Indications,
    DateTimeOffset? StartDate,
    string? DigitalSignature
);

public record CreateClinicalEncounterCommandInput(
    Guid PatientId,
    Guid PractitionerId,
    Guid? AppointmentId,
    string ChiefComplaint,
    string Notes,
    int? PpsScore
);

public record LogAssessmentResponseCommandInput(
    Guid QuestionnaireId,
    Guid PatientId,
    Guid? EncounterId,
    Guid AssessorId,
    string AnswersJson,
    decimal? TotalScore
);

public record SaveClinicalNoteCommandInput(
    Guid EncounterId,
    Guid AuthorId,
    string? Subjective,
    string? Objective,
    string? Assessment,
    string? Plan,
    string? Content,
    string? Signature
);

public record AddDiagnosisCommandInput(
    Guid PatientId,
    string Icd10Code,
    string Description,
    bool IsPrimary,
    DateTimeOffset DiagnosedAt
);
