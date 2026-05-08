using Application.Clinical.Commands;
using Application.Common.Interfaces;
using Application.Patients.Commands;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanChart")]
public class ClinicalMutation
{
    private async Task<bool> VerifyClinicalAccess(
        Guid patientId,
        ICurrentUserService currentUserService,
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var userIdStr = currentUserService.UserId;
        if (string.IsNullOrEmpty(userIdStr))
            return false;

        var user = await userManager.FindByIdAsync(userIdStr);
        if (user == null)
            return false;

        if (user.EmergencyAccessExpiry > DateTimeOffset.UtcNow)
            return true;

        var roles = await userManager.GetRolesAsync(user);
        if (
            roles.Contains("Administrator")
            || roles.Contains("System Admin")
            || roles.Contains("Admin")
        )
            return true;

        if (!Guid.TryParse(userIdStr, out var userId))
            return false;

        var isAssigned = await context.CareNavigationCases.AnyAsync(
            c => c.PatientId == patientId && c.NavigatorId == userId && c.Status == CaseStatus.Open,
            cancellationToken
        );

        if (isAssigned)
            return true;

        var hasAppointment = await context.Appointments.AnyAsync(
            a => a.PatientId == patientId && a.PractitionerId == userId,
            cancellationToken
        );

        return hasAppointment;
    }

    [GraphQLName("createClinicalEncounter")]
    public async Task<Guid> CreateClinicalEncounter(
        CreateClinicalEncounterCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        [Service] ICurrentUserService currentUserService,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (
            !await VerifyClinicalAccess(
                input.PatientId,
                currentUserService,
                userManager,
                context,
                cancellationToken
            )
        )
            throw new UnauthorizedAccessException(
                "Clinical assignment required to start an encounter."
            );

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
    public async Task<Guid> AddAllergy(
        AddAllergyCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        [Service] ICurrentUserService currentUserService,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (
            !await VerifyClinicalAccess(
                input.PatientId,
                currentUserService,
                userManager,
                context,
                cancellationToken
            )
        )
            throw new UnauthorizedAccessException("Clinical assignment required for charting.");

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
    public async Task<Guid> LogVitalSign(
        LogVitalSignCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        [Service] ICurrentUserService currentUserService,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var encounter = await context
            .ClinicalEncounters.AsNoTracking()
            .FirstOrDefaultAsync(e => e.EncounterId == input.EncounterId, cancellationToken);

        if (encounter == null)
            throw new Exception("Encounter not found.");

        if (
            !await VerifyClinicalAccess(
                encounter.PatientId,
                currentUserService,
                userManager,
                context,
                cancellationToken
            )
        )
            throw new UnauthorizedAccessException("Clinical assignment required for charting.");

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
            encounter.PatientId.ToString()
        );
        return result;
    }

    [GraphQLName("completeGuidedEncounter")]
    public async Task<Guid> CompleteGuidedEncounter(
        CompleteGuidedEncounterCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        [Service] ICurrentUserService currentUserService,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var encounter = await context
            .ClinicalEncounters.AsNoTracking()
            .FirstOrDefaultAsync(e => e.EncounterId == input.EncounterId, cancellationToken);

        if (encounter == null)
            throw new Exception("Encounter not found.");

        if (
            !await VerifyClinicalAccess(
                encounter.PatientId,
                currentUserService,
                userManager,
                context,
                cancellationToken
            )
        )
            throw new UnauthorizedAccessException("Clinical assignment required for charting.");

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
            encounter.PatientId.ToString()
        );
        return result;
    }

    [GraphQLName("addPrescription")]
    public async Task<Guid> AddPrescription(
        AddPrescriptionCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        [Service] ICurrentUserService currentUserService,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (
            !await VerifyClinicalAccess(
                input.PatientId,
                currentUserService,
                userManager,
                context,
                cancellationToken
            )
        )
            throw new UnauthorizedAccessException(
                "Clinical assignment required for medication management."
            );

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
    public async Task<Guid> LogAssessmentResponse(
        LogAssessmentResponseCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        [Service] ICurrentUserService currentUserService,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (
            !await VerifyClinicalAccess(
                input.PatientId,
                currentUserService,
                userManager,
                context,
                cancellationToken
            )
        )
            throw new UnauthorizedAccessException("Clinical assignment required for assessments.");

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
    public async Task<Guid> SaveClinicalNote(
        SaveClinicalNoteCommandInput input,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        [Service] ICurrentUserService currentUserService,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var encounter = await context
            .ClinicalEncounters.AsNoTracking()
            .FirstOrDefaultAsync(e => e.EncounterId == input.EncounterId, cancellationToken);

        if (encounter == null)
            throw new Exception("Encounter not found.");

        if (
            !await VerifyClinicalAccess(
                encounter.PatientId,
                currentUserService,
                userManager,
                context,
                cancellationToken
            )
        )
            throw new UnauthorizedAccessException("Clinical assignment required for charting.");

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
            encounter.PatientId.ToString()
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
