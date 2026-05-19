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
    public string? Reason { get; init; }
    public string? Notes { get; init; }
    public DateTimeOffset? NextFollowUpDate { get; init; }
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
            Reason = request.Reason,
            Notes = request.Notes,
            ActivityDate = DateTimeOffset.UtcNow,
            PractitionerId = (await _context.Practitioners.FirstAsync(cancellationToken)).PractitionerId
        };

        outreach.CallAttemptCount++;
        outreach.LastActivityDate = DateTimeOffset.UtcNow;
        
        if (request.NextFollowUpDate.HasValue)
        {
            outreach.NextFollowUpDate = request.NextFollowUpDate;
        }

        // Logic for DNC, Opt-Out, Connected, Recall, and Hold states
        if (request.Outcome == "DNC")
        {
            outreach.IsDoNotCall = true;
            outreach.Status = OutreachStatus.DoNotCall;
        }
        else if (request.Outcome == "OPT_OUT")
        {
            outreach.IsOptedOut = true;
            outreach.Status = OutreachStatus.OptedOut;
        }
        else if (request.Outcome == "CONNECTED" || request.Outcome == "CALL_BACK")
        {
            outreach.Status = OutreachStatus.Contacted;
        }
        else if (request.Outcome == "WRONG_NUMBER" || request.Outcome == "DISCONNECTED")
        {
            outreach.Status = OutreachStatus.OnHold;
        }

        outreach.LatestActivityOutcome = request.Outcome;
        outreach.LatestActivityReason = request.Reason;

        _context.OutreachActivities.Add(activity);
        await _context.SaveChangesAsync(cancellationToken);

        return activity.OutreachActivityId;
    }
}
