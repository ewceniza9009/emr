using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Coordination.Commands;

public record UpdateAdvanceDirectiveCommand : IRequest<Guid>
{
    public Guid PatientId { get; init; }
    public DirectiveType Type { get; init; }
    public bool IsActive { get; init; }
    public string? Notes { get; init; }
    public DateTimeOffset EffectiveDate { get; init; } = DateTimeOffset.UtcNow;
}

public class UpdateAdvanceDirectiveCommandHandler : IRequestHandler<UpdateAdvanceDirectiveCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public UpdateAdvanceDirectiveCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(UpdateAdvanceDirectiveCommand request, CancellationToken cancellationToken)
    {
        // 1. Mark existing directive of the same type as inactive
        var existing = await _context.AdvanceDirectives
            .Where(x => x.PatientId == request.PatientId && x.Type == request.Type && x.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var directive in existing)
        {
            directive.IsActive = false;
        }

        // 2. Add new directive
        var newDirective = new AdvanceDirective
        {
            PatientId = request.PatientId,
            Type = request.Type,
            IsActive = request.IsActive,
            Notes = request.Notes,
            EffectiveDate = request.EffectiveDate
        };

        _context.AdvanceDirectives.Add(newDirective);
        await _context.SaveChangesAsync(cancellationToken);

        return newDirective.AdvanceDirectiveId;
    }
}
