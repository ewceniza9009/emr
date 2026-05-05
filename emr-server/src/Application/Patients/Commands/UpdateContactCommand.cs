using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Commands;

public record UpdateContactCommand(
    Guid PatientContactId,
    string FirstName,
    string LastName,
    RelationshipType Relationship,
    string PhoneNumber,
    string Email,
    bool IsPrimaryContact,
    bool HasPowerOfAttorney,
    bool IsLegalGuardian,
    string? Notes
) : IRequest<bool>;

public class UpdateContactCommandHandler : IRequestHandler<UpdateContactCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateContactCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateContactCommand request, CancellationToken cancellationToken)
    {
        var contact = await _context.PatientContacts
            .FirstOrDefaultAsync(c => c.ContactId == request.PatientContactId, cancellationToken);

        if (contact == null)
        {
            throw new Exception("Contact not found");
        }

        contact.FirstName = request.FirstName;
        contact.LastName = request.LastName;
        contact.Relationship = request.Relationship;
        contact.PhoneNumber = request.PhoneNumber;
        contact.Email = request.Email;
        contact.IsPrimaryContact = request.IsPrimaryContact;
        contact.HasPowerOfAttorney = request.HasPowerOfAttorney;
        contact.IsLegalGuardian = request.IsLegalGuardian;
        contact.Notes = request.Notes;

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
