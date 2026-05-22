using System;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Commands;

public record SendMobileChatMessageCommand(Guid PatientId, Guid CareThreadId, string Content)
    : IRequest<ChatMessage>;

public class SendMobileChatMessageCommandHandler
    : IRequestHandler<SendMobileChatMessageCommand, ChatMessage>
{
    private readonly IApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ISecurityAuditService _auditService;

    private static readonly Regex EmergencyKeywordsPattern = new Regex(
        @"\b(chest\s+pain|angina|cannot\s+breathe|difficulty\s+breathing|short(?:ness)?\s+of\s+breath|severe\s+dyspnea|suffocating|choking?|suicidal|suicide|heart\s+attack)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    private static readonly Regex PreNegationRegex = new Regex(
        @"\b(no|not|deny|denies|denied|negative\s+for|without|free\s+of|rules?\s+out|no\s+signs\s+of)\b\s*(?:(?!but|except|however|yet|though|although)[a-zA-Z']+\s+){0,3}$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    private static readonly Regex PostNegationRegex = new Regex(
        @"^[\s]*(?:(?!but|except|however|yet|though|although)[a-zA-Z']+\s+){0,3}\b(is\s+ruled\s+out|was\s+ruled\s+out|is\s+negative|are\s+negative|ruled\s+out|not\s+present|is\s+not\s+present|resolved)\b",
        RegexOptions.Compiled | RegexOptions.IgnoreCase
    );

    public SendMobileChatMessageCommandHandler(
        IApplicationDbContext context,
        INotificationService notificationService,
        ISecurityAuditService auditService
    )
    {
        _context = context;
        _notificationService = notificationService;
        _auditService = auditService;
    }

    public async Task<ChatMessage> Handle(
        SendMobileChatMessageCommand request,
        CancellationToken cancellationToken
    )
    {
        var patient = await _context
            .Patients.IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId, cancellationToken);

        if (patient == null)
        {
            throw new ArgumentException("Patient not found.");
        }

        var tenantId = patient.TenantId;
        var careThreadId = request.CareThreadId;

        if (careThreadId == Guid.Empty)
        {
            var activeThread = await _context.CareThreads.FirstOrDefaultAsync(
                t => t.PatientId == request.PatientId && t.IsActive,
                cancellationToken
            );

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
                    PatientId = request.PatientId,
                    Subject = "Mobile Chat",
                    IsActive = true,
                };
                _context.CareThreads.Add(thread);
                careThreadId = thread.CareThreadId;
            }
        }

        var message = new ChatMessage
        {
            CareThreadId = careThreadId,
            TenantId = tenantId,
            SenderRole = "patient",
            Content = request.Content,
            Timestamp = DateTimeOffset.UtcNow,
            IsAttachment = false,
        };

        _context.ChatMessages.Add(message);

        // NLP Distress Triage Intercept logic (NegEx-inspired)
        var lowerContent = request.Content.ToLower();
        var matches = EmergencyKeywordsPattern.Matches(lowerContent);
        bool isEmergency = false;

        foreach (Match match in matches)
        {
            string textBefore = lowerContent.Substring(0, match.Index);
            string textAfter = lowerContent.Substring(match.Index + match.Length);

            bool isPreNegated = PreNegationRegex.IsMatch(textBefore);
            bool isPostNegated = PostNegationRegex.IsMatch(textAfter);

            if (!isPreNegated && !isPostNegated)
            {
                isEmergency = true;
                break;
            }
        }

        if (isEmergency)
        {
            patient.TriageNote = null; // Clear previous triage notes if any

            var activeCase = await _context.CareNavigationCases.FirstOrDefaultAsync(
                c => c.PatientId == request.PatientId && c.Status == CaseStatus.Open,
                cancellationToken
            );

            if (activeCase != null)
            {
                activeCase.AcuityLevel = AcuityLevel.Critical;

                if (activeCase.NavigatorId != Guid.Empty)
                {
                    await _notificationService.SendUserNotificationAsync(
                        activeCase.NavigatorId.ToString(),
                        $"CRITICAL TRIAGE ALERT: {patient.FirstName} {patient.LastName}",
                        $"Emergency keyword detected in secure chat: \"{request.Content}\". Patient acuity auto-escalated to Critical.",
                        NotificationPriority.Critical,
                        "Clinical",
                        $"/dashboard/patients/{request.PatientId}"
                    );
                }
            }
            else
            {
                var defaultNavigator = await _context.Practitioners
                    .FirstOrDefaultAsync(p => p.TenantId == patient.TenantId, cancellationToken);
                    
                if (defaultNavigator != null)
                {
                    // Create a new care navigation case
                    activeCase = new CareNavigationCase
                    {
                        CaseId = Guid.NewGuid(),
                        TenantId = patient.TenantId,
                        PatientId = patient.PatientId,
                        NavigatorId = defaultNavigator.PractitionerId,
                        Status = CaseStatus.Open,
                        AcuityLevel = AcuityLevel.Critical,
                        OpenedAt = DateTimeOffset.UtcNow
                    };
                    _context.CareNavigationCases.Add(activeCase);
                }

                await _notificationService.SendGlobalNotificationAsync(
                    $"CRITICAL TRIAGE ALERT: {patient.FirstName} {patient.LastName}",
                    $"Emergency keyword detected in secure chat: \"{request.Content}\". New care case created.",
                    NotificationPriority.Critical,
                    "Clinical",
                    $"/dashboard/patients/{request.PatientId}"
                );
            }

            await _auditService.LogActionAsync(
                "PATIENT_ACUITY_AUTO_ESCALATED",
                $"Clinical auto-triage triggered by chat message: \"{request.Content}\"",
                request.PatientId.ToString()
            );
        }

        await _context.SaveChangesAsync(cancellationToken);

        return message;
    }
}
