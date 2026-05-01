using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Mapster;
using MediatR;

namespace Application.Clinical.Commands;

public class CreateClinicalEncounterCommandHandler : IRequestHandler<CreateClinicalEncounterCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public CreateClinicalEncounterCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<Guid> Handle(CreateClinicalEncounterCommand request, CancellationToken cancellationToken)
    {
        var encounter = request.Adapt<ClinicalEncounter>();
        encounter.EncounterId = Guid.NewGuid();
        encounter.Status = EncounterStatus.Planned;
        encounter.AdmittedAt = _dateTime.UtcNow;

        _context.ClinicalEncounters.Add(encounter);
        await _context.SaveChangesAsync(cancellationToken);

        return encounter.EncounterId;
    }
}
