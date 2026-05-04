using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Outreach.Commands;

public record AddOutreachContactCommand : IRequest<Guid>
{
    public Guid PatientOutreachId { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Relationship { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public string? Email { get; init; }
}

public class AddOutreachContactCommandHandler : IRequestHandler<AddOutreachContactCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public AddOutreachContactCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(AddOutreachContactCommand request, CancellationToken cancellationToken)
    {
        var outreach = await _context.PatientOutreaches
            .FirstOrDefaultAsync(x => x.PatientOutreachId == request.PatientOutreachId, cancellationToken);

        if (outreach == null)
        {
            throw new Exception("Patient Outreach record not found.");
        }

        var contact = new OutreachContact
        {
            PatientOutreachId = request.PatientOutreachId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Relationship = Enum.Parse<RelationshipType>(request.Relationship, true),
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            IsPrimaryContact = false
        };

        _context.OutreachContacts.Add(contact);
        await _context.SaveChangesAsync(cancellationToken);

        return contact.OutreachContactId;
    }
}
