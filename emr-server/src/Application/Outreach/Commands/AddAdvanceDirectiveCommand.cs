using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Application.Outreach.Commands;

public record AddAdvanceDirectiveCommand : IRequest<Guid>
{
    public Guid PatientId { get; init; }
    public DirectiveType Type { get; init; }
    public string? DocumentUrl { get; init; }
    public DateTimeOffset EffectiveDate { get; init; }
    public string? Notes { get; init; }
}

public class AddAdvanceDirectiveCommandHandler : IRequestHandler<AddAdvanceDirectiveCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public AddAdvanceDirectiveCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(AddAdvanceDirectiveCommand request, CancellationToken cancellationToken)
    {
        var directive = new AdvanceDirective
        {
            PatientId = request.PatientId,
            Type = request.Type,
            DocumentUrl = request.DocumentUrl,
            EffectiveDate = request.EffectiveDate,
            Notes = request.Notes,
            IsActive = true
        };

        _context.AdvanceDirectives.Add(directive);
        await _context.SaveChangesAsync(cancellationToken);

        return directive.AdvanceDirectiveId;
    }
}
