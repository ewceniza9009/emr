using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;

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

    public LogAssessmentResponseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(LogAssessmentResponseCommand request, CancellationToken cancellationToken)
    {
        var response = new AssessmentResponse
        {
            QuestionnaireId = request.QuestionnaireId,
            PatientId = request.PatientId,
            EncounterId = request.EncounterId,
            AssessorId = request.AssessorId,
            AnswersJson = request.AnswersJson,
            TotalScore = request.TotalScore,
            CompletedAt = DateTimeOffset.UtcNow
        };

        _context.AssessmentResponses.Add(response);
        await _context.SaveChangesAsync(cancellationToken);

        return response.AssessmentResponseId;
    }
}
