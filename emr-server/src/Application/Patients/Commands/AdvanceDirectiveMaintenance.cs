using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Commands;

public record UpdateAdvanceDirectiveCommand : IRequest<bool>
{
    public Guid AdvanceDirectiveId { get; init; }
    public string? Notes { get; init; }
}

public record RevokeAdvanceDirectiveCommand : IRequest<bool>
{
    public Guid AdvanceDirectiveId { get; init; }
}

public class AdvanceDirectiveHandlers
    : IRequestHandler<UpdateAdvanceDirectiveCommand, bool>,
        IRequestHandler<RevokeAdvanceDirectiveCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public AdvanceDirectiveHandlers(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(
        UpdateAdvanceDirectiveCommand request,
        CancellationToken cancellationToken
    )
    {
        var directive = await _context.AdvanceDirectives.FirstOrDefaultAsync(
            d => d.AdvanceDirectiveId == request.AdvanceDirectiveId,
            cancellationToken
        );

        if (directive == null)
            return false;

        directive.Notes = request.Notes;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> Handle(
        RevokeAdvanceDirectiveCommand request,
        CancellationToken cancellationToken
    )
    {
        var directive = await _context.AdvanceDirectives.FirstOrDefaultAsync(
            d => d.AdvanceDirectiveId == request.AdvanceDirectiveId,
            cancellationToken
        );

        if (directive == null)
            return false;

        directive.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
