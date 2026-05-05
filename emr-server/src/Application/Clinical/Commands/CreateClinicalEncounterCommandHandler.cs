using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

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
            PpsScore = request.PpsScore,
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

        // Update linked appointment status
        if (request.AppointmentId.HasValue)
        {
            var appointment = await _context.Appointments
                .FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId.Value, cancellationToken);
            if (appointment != null)
            {
                appointment.Status = AppointmentStatus.InProgress;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return encounter.EncounterId;
    }
}
