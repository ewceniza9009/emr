using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Commands;

public class AddContactCommandHandler : IRequestHandler<AddContactCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public AddContactCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(AddContactCommand request, CancellationToken cancellationToken)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId, cancellationToken);

        if (patient == null)
        {
            throw new Exception("Patient not found");
        }

        var contact = new PatientContact
        {
            ContactId = Guid.NewGuid(),
            PatientId = request.PatientId,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Relationship = request.Relationship,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            IsPrimaryContact = request.IsPrimaryContact,
            HasPowerOfAttorney = request.HasPowerOfAttorney,
            IsLegalGuardian = request.IsLegalGuardian,
            Notes = request.Notes
        };

        _context.PatientContacts.Add(contact);
        await _context.SaveChangesAsync(cancellationToken);

        return contact.ContactId;
    }
}
