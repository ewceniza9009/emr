using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Commands;

public record RemoveOutreachContactCommand : IRequest<bool>
{
    public Guid OutreachContactId { get; init; }
}

public class RemoveOutreachContactCommandHandler : IRequestHandler<RemoveOutreachContactCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public RemoveOutreachContactCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(RemoveOutreachContactCommand request, CancellationToken cancellationToken)
    {
        var contact = await _context.OutreachContacts
            .FirstOrDefaultAsync(c => c.OutreachContactId == request.OutreachContactId, cancellationToken);

        if (contact == null)
        {
            return false;
        }

        _context.OutreachContacts.Remove(contact);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
