using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Commands;

public record DeleteContactCommand(Guid PatientContactId) : IRequest<bool>;

public class DeleteContactCommandHandler : IRequestHandler<DeleteContactCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public DeleteContactCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteContactCommand request, CancellationToken cancellationToken)
    {
        var contact = await _context.PatientContacts
            .FirstOrDefaultAsync(c => c.ContactId == request.PatientContactId, cancellationToken);

        if (contact == null)
        {
            return false;
        }

        _context.PatientContacts.Remove(contact);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
