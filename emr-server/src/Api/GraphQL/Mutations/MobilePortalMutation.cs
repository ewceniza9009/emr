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

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class MobilePortalMutation
{
    [UsePatientAccess]
    public async Task<ChatMessage> SendMobileChatMessage(
        Guid patientId,
        Guid careThreadId,
        string content,
        [Service] IApplicationDbContext context,
        [Service] IHubContext<ChatHub> hubContext,
        [Service] INotificationService notificationService,
        [Service] ISecurityAuditService auditService,
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

        var tenantId = patient.TenantId;

        if (careThreadId == Guid.Empty)
        {
            var activeThread = await context.CareThreads
                .FirstOrDefaultAsync(t => t.PatientId == patientId && t.IsActive, cancellationToken);

            if (activeThread != null)
            {
                careThreadId = activeThread.CareThreadId;
            }
            else
            {
                var thread = new CareThread
                {
                    CareThreadId = Guid.NewGuid(),
                    TenantId = tenantId,
                    PatientId = patientId,
                    Subject = "Mobile Chat",
                    IsActive = true
                };
                context.CareThreads.Add(thread);
                careThreadId = thread.CareThreadId;
            }
        }

        var message = new ChatMessage
        {
            CareThreadId = careThreadId,
            TenantId = tenantId,
            SenderRole = "patient",
            Content = content,
            Timestamp = DateTimeOffset.UtcNow,
            IsAttachment = false
        };

        context.ChatMessages.Add(message);

        // NLP Distress Triage Intercept logic
        var lowerContent = content.ToLower();
        bool isEmergency = lowerContent.Contains("chest pain") 
            || lowerContent.Contains("cannot breathe") 
            || lowerContent.Contains("difficulty breathing")
            || lowerContent.Contains("heart attack")
            || lowerContent.Contains("severe dyspnea")
            || lowerContent.Contains("suffocating")
            || lowerContent.Contains("choking")
            || lowerContent.Contains("suicidal");

        if (isEmergency)
        {
            var activeCase = await context.CareNavigationCases
                .FirstOrDefaultAsync(c => c.PatientId == patientId && c.Status == Domain.Enums.CaseStatus.Open, cancellationToken);

            if (activeCase != null)
            {
                activeCase.AcuityLevel = Domain.Enums.AcuityLevel.Critical;
                
                if (activeCase.NavigatorId != Guid.Empty)
                {
                    await notificationService.SendUserNotificationAsync(
                        activeCase.NavigatorId.ToString(),
                        $"CRITICAL TRIAGE ALERT: {patient.FirstName} {patient.LastName}",
                        $"Emergency keyword detected in secure chat: \"{content}\". Patient acuity auto-escalated to Critical.",
                        Domain.Enums.NotificationPriority.Critical,
                        "Clinical",
                        $"/dashboard/patients/{patientId}"
                    );
                }
            }
            else
            {
                await notificationService.SendGlobalNotificationAsync(
                    $"CRITICAL TRIAGE ALERT: {patient.FirstName} {patient.LastName}",
                    $"Emergency keyword detected in secure chat: \"{content}\". Patient has no active care navigator assigned.",
                    Domain.Enums.NotificationPriority.Critical,
                    "Clinical",
                    $"/dashboard/patients/{patientId}"
                );
            }

            await auditService.LogActionAsync(
                "PATIENT_ACUITY_AUTO_ESCALATED",
                $"Clinical auto-triage triggered by chat message: \"{content}\"",
                patientId.ToString()
            );
        }

        await context.SaveChangesAsync(cancellationToken);

        await hubContext.Clients.Group($"CareThread_{careThreadId}").SendAsync("ReceiveMessage", new {
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
