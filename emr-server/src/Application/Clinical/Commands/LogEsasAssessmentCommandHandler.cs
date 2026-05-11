using Application.Common.Interfaces;
using Domain.Entities;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Clinical.Commands;

public class LogEsasAssessmentCommandHandler : IRequestHandler<LogEsasAssessmentCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;
    private readonly INotificationService _notificationService;

    public LogEsasAssessmentCommandHandler(
        IApplicationDbContext context,
        IDateTimeProvider dateTime,
        INotificationService notificationService
    )
    {
        _context = context;
        _dateTime = dateTime;
        _notificationService = notificationService;
    }

    public async Task<Guid> Handle(
        LogEsasAssessmentCommand request,
        CancellationToken cancellationToken
    )
    {
        var assessment = request.Adapt<EsasAssessment>();
        assessment.AssessmentId = Guid.NewGuid();
        assessment.AssessedAt = _dateTime.UtcNow;

        _context.EsasAssessments.Add(assessment);
        await _context.SaveChangesAsync(cancellationToken);

        // Triage: Check for high distress scores (> 7 is critical in palliative care)
        if (assessment.Pain > 7 || assessment.ShortnessOfBreath > 7 || assessment.Anxiety > 7 || assessment.Wellbeing > 7)
        {
            var targetPatientId = assessment.PatientId;
            var patient = await _context.Patients
                .Include(p => p.CareNavigationCases)
                .FirstOrDefaultAsync(p => p.PatientId == targetPatientId, cancellationToken);

            if (patient != null && patient.CareNavigationCases != null)
            {
                var navigatorId = patient.CareNavigationCases
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => c.NavigatorId.ToString())
                    .FirstOrDefault();

                if (!string.IsNullOrEmpty(navigatorId))
                {
                    await _notificationService.SendUserNotificationAsync(
                        navigatorId,
                        "CRITICAL SYMPTOM ALERT",
                        $"Patient {patient.FirstName} {patient.LastName} reported a high symptom score: {Math.Max(assessment.Pain, assessment.Wellbeing)}. Immediate triage required.",
                        Domain.Enums.NotificationPriority.Critical,
                        category: "Clinical",
                        actionUrl: $"/patients/{patient.PatientId}/triage"
                    );
                }
            }
        }

        return assessment.AssessmentId;
    }
}
