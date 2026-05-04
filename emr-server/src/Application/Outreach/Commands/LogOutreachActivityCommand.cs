using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Commands;

public record LogOutreachActivityCommand : IRequest<Guid>
{
    public Guid OutreachId { get; init; }
    public OutreachMethod Method { get; init; }
    public string? Outcome { get; init; }
    public string? Notes { get; init; }
}

public class LogOutreachActivityCommandHandler : IRequestHandler<LogOutreachActivityCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public LogOutreachActivityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(LogOutreachActivityCommand request, CancellationToken cancellationToken)
    {
        var outreach = await _context.PatientOutreaches
            .FirstOrDefaultAsync(x => x.PatientOutreachId == request.OutreachId, cancellationToken);

        if (outreach == null)
        {
            throw new Exception("Outreach target not found.");
        }

        var activity = new OutreachActivity
        {
            OutreachId = request.OutreachId,
            Method = request.Method,
            Outcome = request.Outcome,
            Notes = request.Notes,
            ActivityDate = DateTimeOffset.UtcNow,
            // In a real app, we'd get this from the current user service
            PractitionerId = (await _context.Practitioners.FirstAsync(cancellationToken)).PractitionerId
        };

        outreach.CallAttemptCount++;
        outreach.LastActivityDate = DateTimeOffset.UtcNow;
        
        // If it's a "No Answer", we might want to update status if attempts > limit
        // but for now we just increment the counter.

        _context.OutreachActivities.Add(activity);
        await _context.SaveChangesAsync(cancellationToken);

        return activity.OutreachActivityId;
    }
}
