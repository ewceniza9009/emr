using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Application.Outreach.Commands;

public class CreateOutreachCommandHandler : IRequestHandler<CreateOutreachCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateOutreachCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateOutreachCommand request, CancellationToken cancellationToken)
    {
        var outreach = new PatientOutreach
        {
            PatientOutreachId = Guid.NewGuid(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            ReferralSource = request.ReferralSource,
            PrimaryPhone = request.PrimaryPhone,
            PrimaryEmail = request.PrimaryEmail,
            Status = OutreachStatus.Lead,
            Notes = request.Notes,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _context.PatientOutreaches.Add(outreach);
        await _context.SaveChangesAsync(cancellationToken);

        return outreach.PatientOutreachId;
    }
}
