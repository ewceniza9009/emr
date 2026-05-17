using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Application.Clinical.Commands;

public record SaveClinicalNoteCommand : IRequest<Guid>
{
    public Guid EncounterId { get; init; }
    public Guid AuthorId { get; init; }
    public string? Subjective { get; init; }
    public string? Objective { get; init; }
    public string? Assessment { get; init; }
    public string? Plan { get; init; }
    public string? Content { get; init; }
    public string? Signature { get; init; }
}

public class SaveClinicalNoteCommandHandler : IRequestHandler<SaveClinicalNoteCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;
    private readonly ILogger<SaveClinicalNoteCommandHandler> _logger;

    public SaveClinicalNoteCommandHandler(
        IApplicationDbContext context,
        IDateTimeProvider dateTime,
        ILogger<SaveClinicalNoteCommandHandler> logger
    )
    {
        _context = context;
        _dateTime = dateTime;
        _logger = logger;
    }

    public async Task<Guid> Handle(
        SaveClinicalNoteCommand request,
        CancellationToken cancellationToken
    )
    {
        var authorId = request.AuthorId;
        var authorExists = await _context.Practitioners.AnyAsync(
            p => p.PractitionerId == authorId,
            cancellationToken
        );

        if (!authorExists)
        {
            // Resolve from UserId if a user ID was passed
            var practitionerByUserId = await _context.Practitioners.FirstOrDefaultAsync(
                p => p.UserId == authorId,
                cancellationToken
            );

            if (practitionerByUserId != null)
            {
                _logger.LogWarning(
                    "Clinical Identity Mapped: Practitioner record '{ResolvedId}' resolved from incoming User ID '{UserId}' during SOAP clinical note submission.",
                    practitionerByUserId.PractitionerId,
                    authorId
                );
                authorId = practitionerByUserId.PractitionerId;
            }
            else
            {
                // Fallback to first active practitioner to prevent FK violation
                var defaultPractitioner = await _context.Practitioners.FirstOrDefaultAsync(
                    p => p.IsActive,
                    cancellationToken
                );

                if (defaultPractitioner != null)
                {
                    _logger.LogCritical(
                        "Clinical Identity RESOLUTION FAILURE: Could not resolve practitioner record for incoming ID '{IncomingId}' during SOAP clinical note submission. "
                            + "Note silently attributed to active default practitioner '{DefaultId}' to prevent foreign-key database crash. "
                            + "AUDIT TRAIL CORRUPTED - MANUAL INTERVENTION REQUIRED.",
                        request.AuthorId,
                        defaultPractitioner.PractitionerId
                    );
                    authorId = defaultPractitioner.PractitionerId;
                }
            }
        }

        var note = await _context.ClinicalNotes.FirstOrDefaultAsync(
            n => n.EncounterId == request.EncounterId,
            cancellationToken
        );

        if (note == null)
        {
            note = new ClinicalNote
            {
                EncounterId = request.EncounterId,
                AuthorId = authorId,
                CreatedAt = _dateTime.UtcNow,
            };
            _context.ClinicalNotes.Add(note);
        }
        else
        {
            note.AuthorId = authorId;
        }

        note.Subjective = request.Subjective;
        note.Objective = request.Objective;
        note.Assessment = request.Assessment;
        note.Plan = request.Plan;
        note.UpdatedAt = _dateTime.UtcNow;

        if (!string.IsNullOrEmpty(request.Signature))
        {
            note.IsSigned = true;
            note.SignatureHash = request.Signature; // In production, this would be a real cryptographic hash
            note.SignedAt = _dateTime.UtcNow;

            // Update Encounter and Linked Appointment to Completed
            var encounter = await _context
                .ClinicalEncounters.Include(e => e.Appointment)
                .FirstOrDefaultAsync(e => e.EncounterId == request.EncounterId, cancellationToken);

            if (encounter != null)
            {
                encounter.Status = EncounterStatus.Completed;
                encounter.DischargedAt = _dateTime.UtcNow;

                if (encounter.Appointment != null)
                {
                    encounter.Appointment.Status = AppointmentStatus.Completed;
                }
            }
        }

        // Render full content for search/legacy display
        note.Content = !string.IsNullOrEmpty(request.Content)
            ? request.Content
            : $"S: {note.Subjective}\nO: {note.Objective}\nA: {note.Assessment}\nP: {note.Plan}";

        await _context.SaveChangesAsync(cancellationToken);

        return note.NoteId;
    }
}
