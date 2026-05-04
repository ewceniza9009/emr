using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Patients.Commands;

public class AddAllergyCommandHandler : IRequestHandler<AddAllergyCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public AddAllergyCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(AddAllergyCommand request, CancellationToken cancellationToken)
    {
        var entity = new Allergy
        {
            PatientId = request.PatientId,
            Allergen = request.Allergen,
            Severity = request.Severity,
            Reaction = request.Reaction,
            IdentifiedAt = request.IdentifiedAt
        };

        _context.Allergies.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return entity.AllergyId;
    }
}
