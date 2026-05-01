using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Mapster;
using MediatR;

namespace Application.Navigation.Commands;

public class CreateCareNavigationCaseCommandHandler : IRequestHandler<CreateCareNavigationCaseCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public CreateCareNavigationCaseCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<Guid> Handle(CreateCareNavigationCaseCommand request, CancellationToken cancellationToken)
    {
        var navCase = request.Adapt<CareNavigationCase>();
        navCase.CaseId = Guid.NewGuid();
        navCase.Status = CaseStatus.Open;
        navCase.OpenedAt = _dateTime.UtcNow;

        _context.CareNavigationCases.Add(navCase);
        await _context.SaveChangesAsync(cancellationToken);

        return navCase.CaseId;
    }
}
