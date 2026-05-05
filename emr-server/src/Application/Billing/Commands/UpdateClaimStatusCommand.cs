using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Domain.Entities;

namespace Application.Billing.Commands;

public record UpdateClaimStatusCommand(
    Guid ClaimId,
    ClaimStatus NewStatus,
    string? Remarks = null
) : IRequest<bool>;

public class UpdateClaimStatusCommandHandler : IRequestHandler<UpdateClaimStatusCommand, bool>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public UpdateClaimStatusCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<bool> Handle(UpdateClaimStatusCommand request, CancellationToken cancellationToken)
    {
        var claim = await _context.ZBenefitClaims.FirstOrDefaultAsync(c => c.ClaimId == request.ClaimId, cancellationToken);
        if (claim == null) return false;

        var oldStatus = claim.Status;
        claim.Status = request.NewStatus;

        if (request.NewStatus == ClaimStatus.Approved) claim.ApprovedAt = _dateTime.UtcNow;
        if (request.NewStatus == ClaimStatus.Paid) claim.PaidAt = _dateTime.UtcNow;

        _context.ClaimStatusLogs.Add(new ClaimStatusLog
        {
            LogId = Guid.NewGuid(),
            ClaimId = claim.ClaimId,
            PreviousStatus = oldStatus,
            NewStatus = request.NewStatus,
            ChangedBy = "System Admin",
            Remarks = request.Remarks,
            ChangedAt = _dateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
