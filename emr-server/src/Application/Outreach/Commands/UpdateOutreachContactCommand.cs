using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Commands;

public record UpdateOutreachContactCommand : IRequest<bool>
{
    public Guid OutreachContactId { get; init; }
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Relationship { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
}

public class UpdateOutreachContactCommandHandler
    : IRequestHandler<UpdateOutreachContactCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateOutreachContactCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(
        UpdateOutreachContactCommand request,
        CancellationToken cancellationToken
    )
    {
        var contact = await _context.OutreachContacts.FirstOrDefaultAsync(
            x => x.OutreachContactId == request.OutreachContactId,
            cancellationToken
        );

        if (contact == null)
        {
            return false;
        }

        if (request.FirstName != null)
            contact.FirstName = request.FirstName;

        if (request.LastName != null)
            contact.LastName = request.LastName;

        if (request.Relationship != null)
            contact.Relationship = Enum.Parse<RelationshipType>(request.Relationship, true);

        if (request.PhoneNumber != null)
            contact.PhoneNumber = request.PhoneNumber;

        if (request.Email != null)
            contact.Email = request.Email;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
