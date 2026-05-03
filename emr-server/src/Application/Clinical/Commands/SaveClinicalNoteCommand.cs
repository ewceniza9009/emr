using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Clinical.Commands;

public record SaveClinicalNoteCommand : IRequest<Guid>
{
    public Guid EncounterId { get; init; }
    public Guid AuthorId { get; init; }
    public string? Subjective { get; init; }
    public string? Objective { get; init; }
    public string? Assessment { get; init; }
    public string? Plan { get; init; }
    public string? Signature { get; init; }
}

public class SaveClinicalNoteCommandHandler : IRequestHandler<SaveClinicalNoteCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public SaveClinicalNoteCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<Guid> Handle(SaveClinicalNoteCommand request, CancellationToken cancellationToken)
    {
        var note = await _context.ClinicalNotes
            .FirstOrDefaultAsync(n => n.EncounterId == request.EncounterId, cancellationToken);

        if (note == null)
        {
            note = new ClinicalNote
            {
                EncounterId = request.EncounterId,
                AuthorId = request.AuthorId,
                CreatedAt = _dateTime.UtcNow
            };
            _context.ClinicalNotes.Add(note);
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
        }

        // Render full content for search/legacy display
        note.Content = $"S: {note.Subjective}\nO: {note.Objective}\nA: {note.Assessment}\nP: {note.Plan}";

        await _context.SaveChangesAsync(cancellationToken);

        return note.NoteId;
    }
}
