using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Clinical.Commands;

public record CompleteGuidedEncounterCommand : IRequest<Guid>
{
    public Guid EncounterId { get; init; }
    public EncounterType Type { get; init; }
    public int PpsScore { get; init; }
    public string Subjective { get; init; } = string.Empty;
    public string Objective { get; init; } = string.Empty;
    public string Assessment { get; init; } = string.Empty;
    public string Plan { get; init; } = string.Empty;
    
    // ESAS Scores
    public int Pain { get; init; }
    public int Tiredness { get; init; }
    public int Drowsiness { get; init; }
    public int Nausea { get; init; }
    public int LackOfAppetite { get; init; }
    public int ShortnessOfBreath { get; init; }
    public int Depression { get; init; }
    public int Anxiety { get; init; }
    public int Wellbeing { get; init; }
}

public class CompleteGuidedEncounterCommandHandler : IRequestHandler<CompleteGuidedEncounterCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IElationClient _elationClient;

    public CompleteGuidedEncounterCommandHandler(IApplicationDbContext context, IElationClient elationClient)
    {
        _context = context;
        _elationClient = elationClient;
    }

    public async Task<Guid> Handle(CompleteGuidedEncounterCommand request, CancellationToken cancellationToken)
    {
        var encounter = await _context.ClinicalEncounters
            .Include(x => x.Patient)
            .FirstOrDefaultAsync(x => x.EncounterId == request.EncounterId, cancellationToken);

        if (encounter == null) throw new Exception("Encounter not found");

        // 1. Update Encounter Header
        encounter.Type = request.Type;
        encounter.PpsScore = request.PpsScore;
        encounter.Status = EncounterStatus.Completed;
        encounter.DischargedAt = DateTimeOffset.UtcNow;

        // 2. Add ESAS Assessment
        var esas = new EsasAssessment
        {
            PatientId = encounter.PatientId,
            EncounterId = encounter.EncounterId,
            Pain = request.Pain,
            Tiredness = request.Tiredness,
            Drowsiness = request.Drowsiness,
            Nausea = request.Nausea,
            LackOfAppetite = request.LackOfAppetite,
            ShortnessOfBreath = request.ShortnessOfBreath,
            Depression = request.Depression,
            Anxiety = request.Anxiety,
            Wellbeing = request.Wellbeing,
            AssessedAt = DateTimeOffset.UtcNow
        };
        _context.EsasAssessments.Add(esas);

        // 3. Add SOAP Notes as ClinicalNotes
        var notes = new List<ClinicalNote>
        {
            new ClinicalNote { EncounterId = encounter.EncounterId, Type = NoteType.Subjective, Content = request.Subjective },
            new ClinicalNote { EncounterId = encounter.EncounterId, Type = NoteType.Objective, Content = request.Objective },
            new ClinicalNote { EncounterId = encounter.EncounterId, Type = NoteType.Assessment, Content = request.Assessment },
            new ClinicalNote { EncounterId = encounter.EncounterId, Type = NoteType.Plan, Content = request.Plan }
        };
        _context.ClinicalNotes.AddRange(notes);

        await _context.SaveChangesAsync(cancellationToken);

        // 4. Trigger External Sync to Elation Health
        try 
        {
            await _elationClient.PushSoapNoteAsync(encounter.EncounterId, cancellationToken);
        }
        catch (Exception ex)
        {
            // Log but don't fail the primary save
            // In production, we'd queue this for retry
            Console.WriteLine($"Elation Sync Failed: {ex.Message}");
        }

        return encounter.EncounterId;
    }
}
