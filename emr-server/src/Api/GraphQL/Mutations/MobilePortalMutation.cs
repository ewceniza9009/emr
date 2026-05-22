using Api.GraphQL.Attributes;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Types;
using Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using MediatR;
using Application.Patients.Commands;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class MobilePortalMutation
{
    [UsePatientAccess]
    public async Task<ChatMessage> SendMobileChatMessage(
        Guid patientId,
        Guid careThreadId,
        string content,
        [Service] IMediator mediator,
        [Service] IHubContext<ChatHub> hubContext,
        CancellationToken cancellationToken
    )
    {
        var command = new SendMobileChatMessageCommand(patientId, careThreadId, content);
        var message = await mediator.Send(command, cancellationToken);

        await hubContext.Clients.Group($"CareThread_{message.CareThreadId}").SendAsync("ReceiveMessage", new {
            chatMessageId = message.ChatMessageId,
            careThreadId = message.CareThreadId,
            senderRole = message.SenderRole,
            content = message.Content,
            timestamp = message.Timestamp,
            isAttachment = message.IsAttachment
        }, cancellationToken);

        return message;
    }

    [UsePatientAccess]
    public async Task<VitalSign> SaveMobileVitals(
        Guid patientId,
        decimal? heartRate,
        decimal? bloodPressureSystolic,
        decimal? bloodPressureDiastolic,
        decimal? temperature,
        decimal? oxygenSaturation,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var patient = await context.Patients
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);

        if (patient == null)
        {
            throw new ArgumentException("Patient not found.");
        }

        // Find or create an active encounter
        var encounter = await context.ClinicalEncounters
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(e => e.PatientId == patientId && 
                                     e.Status != Domain.Enums.EncounterStatus.Completed && 
                                     e.Status != Domain.Enums.EncounterStatus.Cancelled && 
                                     e.Status != Domain.Enums.EncounterStatus.Discharged, 
                                     cancellationToken);

        if (encounter == null)
        {
            encounter = await context.ClinicalEncounters
                .IgnoreQueryFilters()
                .OrderByDescending(e => e.EncounterDate)
                .FirstOrDefaultAsync(e => e.PatientId == patientId, cancellationToken);
        }

        if (encounter == null)
        {
            var practitioner = await context.Practitioners.IgnoreQueryFilters().OrderBy(p => p.PractitionerId).FirstOrDefaultAsync(cancellationToken);
            encounter = new ClinicalEncounter
            {
                EncounterId = Guid.NewGuid(),
                TenantId = patient.TenantId,
                PatientId = patientId,
                PractitionerId = practitioner?.PractitionerId ?? Guid.Empty,
                Type = Domain.Enums.EncounterType.RoutineFollowUp,
                Status = Domain.Enums.EncounterStatus.InProgress,
                EncounterDate = DateTimeOffset.UtcNow,
                ChiefComplaint = "Self-Logged Vitals from Patient App"
            };
            context.ClinicalEncounters.Add(encounter);
        }

        var vital = new VitalSign
        {
            VitalId = Guid.NewGuid(),
            TenantId = patient.TenantId,
            EncounterId = encounter.EncounterId,
            HeartRate = heartRate,
            BloodPressureSystolic = bloodPressureSystolic,
            BloodPressureDiastolic = bloodPressureDiastolic,
            Temperature = temperature,
            OxygenSaturation = oxygenSaturation,
            RecordedAt = DateTimeOffset.UtcNow
        };

        context.VitalSigns.Add(vital);
        await context.SaveChangesAsync(cancellationToken);

        return vital;
    }

    [UsePatientAccess]
    public async Task<EsasAssessment> SaveEsasAssessment(
        Guid patientId,
        int pain,
        int tiredness,
        int drowsiness,
        int nausea,
        int lackOfAppetite,
        int shortnessOfBreath,
        int depression,
        int anxiety,
        int wellbeing,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var patient = await context.Patients
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);

        if (patient == null)
        {
            throw new ArgumentException("Patient not found.");
        }

        var assessment = new EsasAssessment
        {
            AssessmentId = Guid.NewGuid(),
            TenantId = patient.TenantId,
            PatientId = patientId,
            Pain = pain,
            Tiredness = tiredness,
            Drowsiness = drowsiness,
            Nausea = nausea,
            LackOfAppetite = lackOfAppetite,
            ShortnessOfBreath = shortnessOfBreath,
            Depression = depression,
            Anxiety = anxiety,
            Wellbeing = wellbeing,
            AssessedAt = DateTimeOffset.UtcNow
        };

        context.EsasAssessments.Add(assessment);
        await context.SaveChangesAsync(cancellationToken);

        return assessment;
    }
}
