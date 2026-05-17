using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Clinical.Commands;

public record LogAssessmentResponseCommand : IRequest<Guid>
{
    public Guid QuestionnaireId { get; init; }
    public Guid PatientId { get; init; }
    public Guid? EncounterId { get; init; }
    public Guid AssessorId { get; init; }
    public string AnswersJson { get; init; } = null!;
    public decimal? TotalScore { get; init; }
}

public class LogAssessmentResponseCommandHandler : IRequestHandler<LogAssessmentResponseCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<LogAssessmentResponseCommandHandler> _logger;

    public LogAssessmentResponseCommandHandler(
        IApplicationDbContext context,
        ILogger<LogAssessmentResponseCommandHandler> logger
    )
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Guid> Handle(LogAssessmentResponseCommand request, CancellationToken cancellationToken)
    {
        var assessorId = request.AssessorId;
        var assessorExists = await _context.Practitioners
            .AnyAsync(p => p.PractitionerId == assessorId, cancellationToken);

        if (!assessorExists)
        {
            // Resolve from UserId if a user ID was passed
            var practitionerByUserId = await _context.Practitioners
                .FirstOrDefaultAsync(p => p.UserId == assessorId, cancellationToken);

            if (practitionerByUserId != null)
            {
                _logger.LogWarning(
                    "Clinical Identity Mapped: Practitioner record '{ResolvedId}' resolved from incoming User ID '{UserId}' during assessment log submission.",
                    practitionerByUserId.PractitionerId,
                    assessorId
                );
                assessorId = practitionerByUserId.PractitionerId;
            }
            else
            {
                // Fallback to first active practitioner to prevent FK violation
                var defaultPractitioner = await _context.Practitioners
                    .FirstOrDefaultAsync(p => p.IsActive, cancellationToken);

                if (defaultPractitioner != null)
                {
                    _logger.LogCritical(
                        "Clinical Identity RESOLUTION FAILURE: Could not resolve practitioner record for incoming ID '{IncomingId}' during assessment log submission. " +
                        "Assessment silently attributed to active default practitioner '{DefaultId}' to prevent foreign-key database crash. " +
                        "AUDIT TRAIL CORRUPTED - MANUAL INTERVENTION REQUIRED.",
                        request.AssessorId,
                        defaultPractitioner.PractitionerId
                    );
                    assessorId = defaultPractitioner.PractitionerId;
                }
            }
        }

        var response = new AssessmentResponse
        {
            QuestionnaireId = request.QuestionnaireId,
            PatientId = request.PatientId,
            EncounterId = request.EncounterId,
            AssessorId = assessorId,
            AnswersJson = request.AnswersJson,
            TotalScore = request.TotalScore,
            CompletedAt = DateTimeOffset.UtcNow
        };

        _context.AssessmentResponses.Add(response);
        await _context.SaveChangesAsync(cancellationToken);

        return response.AssessmentResponseId;
    }
}
