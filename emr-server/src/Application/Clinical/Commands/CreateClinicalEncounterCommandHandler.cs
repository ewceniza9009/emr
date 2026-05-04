using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Application.Clinical.Commands;

public class CreateClinicalEncounterCommandHandler
    : IRequestHandler<CreateClinicalEncounterCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public CreateClinicalEncounterCommandHandler(
        IApplicationDbContext context,
        IDateTimeProvider dateTime
    )
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<Guid> Handle(
        CreateClinicalEncounterCommand request,
        CancellationToken cancellationToken
    )
    {
        var encounter = new ClinicalEncounter
        {
            EncounterId = Guid.NewGuid(),
            PatientId = request.PatientId,
            PractitionerId = request.PractitionerId,
            AppointmentId = request.AppointmentId,
            Status = EncounterStatus.InProgress,
            AdmittedAt = _dateTime.UtcNow,
            ChiefComplaint = request.ChiefComplaint,
        };

        // Create the initial clinical note
        var note = new ClinicalNote
        {
            NoteId = Guid.NewGuid(),
            EncounterId = encounter.EncounterId,
            AuthorId = request.PractitionerId,
            Content = request.Notes,
            CreatedAt = _dateTime.UtcNow,
            IsSigned = false,
            Type = NoteType.Progress,
        };

        _context.ClinicalEncounters.Add(encounter);
        _context.ClinicalNotes.Add(note);
        await _context.SaveChangesAsync(cancellationToken);

        return encounter.EncounterId;
    }
}
