using MediatR;
using Microsoft.EntityFrameworkCore;
using Application.Common.Interfaces;

namespace Application.Patients.Commands;

public record UpdateTriageNoteCommand(Guid PatientId, string? TriageNote) : IRequest<bool>;

public class UpdateTriageNoteCommandHandler : IRequestHandler<UpdateTriageNoteCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateTriageNoteCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateTriageNoteCommand request, CancellationToken cancellationToken)
    {
        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId, cancellationToken);

        if (patient == null)
            return false;

        patient.TriageNote = request.TriageNote;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
