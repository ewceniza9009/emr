using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Outreach.Commands;

public record LogSpiritualAssessmentCommand : IRequest<Guid>
{
    public Guid EncounterId { get; init; }
    public Guid PatientId { get; init; }
    public string? Faith { get; init; }
    public string? Importance { get; init; }
    public string? Community { get; init; }
    public string? AddressInCare { get; init; }
    public string? ReligiousPreference { get; init; }
    public string? ClergyContact { get; init; }
}

public class LogSpiritualAssessmentCommandHandler : IRequestHandler<LogSpiritualAssessmentCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public LogSpiritualAssessmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(LogSpiritualAssessmentCommand request, CancellationToken cancellationToken)
    {
        var assessment = new SpiritualAssessment
        {
            EncounterId = request.EncounterId,
            PatientId = request.PatientId,
            Faith = request.Faith,
            Importance = request.Importance,
            Community = request.Community,
            AddressInCare = request.AddressInCare,
            ReligiousPreference = request.ReligiousPreference,
            ClergyContact = request.ClergyContact
        };

        _context.SpiritualAssessments.Add(assessment);
        await _context.SaveChangesAsync(cancellationToken);

        return assessment.SpiritualAssessmentId;
    }
}
