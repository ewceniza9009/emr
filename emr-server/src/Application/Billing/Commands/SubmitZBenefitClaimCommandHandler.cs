using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Mapster;
using MediatR;

namespace Application.Billing.Commands;

public class SubmitZBenefitClaimCommandHandler : IRequestHandler<SubmitZBenefitClaimCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public SubmitZBenefitClaimCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<Guid> Handle(SubmitZBenefitClaimCommand request, CancellationToken cancellationToken)
    {
        var claim = request.Adapt<ZBenefitClaim>();
        claim.ClaimId = Guid.NewGuid();
        claim.Status = ClaimStatus.Submitted;
        claim.CreatedAt = _dateTime.UtcNow;
        claim.SubmittedAt = _dateTime.UtcNow;

        _context.ZBenefitClaims.Add(claim);
        
        // Log the status change
        _context.ClaimStatusLogs.Add(new ClaimStatusLog
        {
            LogId = Guid.NewGuid(),
            ClaimId = claim.ClaimId,
            PreviousStatus = ClaimStatus.Pending,
            NewStatus = ClaimStatus.Submitted,
            ChangedBy = "System",
            Remarks = "Initial submission",
            ChangedAt = _dateTime.UtcNow
        });

        await _context.SaveChangesAsync(cancellationToken);

        return claim.ClaimId;
    }
}
