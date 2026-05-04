using Application.Common.Interfaces;
using Domain.Entities;
using Mapster;
using MediatR;

namespace Application.Clinical.Commands;

public class LogEsasAssessmentCommandHandler : IRequestHandler<LogEsasAssessmentCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public LogEsasAssessmentCommandHandler(
        IApplicationDbContext context,
        IDateTimeProvider dateTime
    )
    {
        _context = context;
        _dateTime = dateTime;
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

        return assessment.AssessmentId;
    }
}
