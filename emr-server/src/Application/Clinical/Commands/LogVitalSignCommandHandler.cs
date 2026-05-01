using Application.Common.Interfaces;
using Domain.Entities;
using Mapster;
using MediatR;

namespace Application.Clinical.Commands;

public class LogVitalSignCommandHandler : IRequestHandler<LogVitalSignCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IDateTimeProvider _dateTime;

    public LogVitalSignCommandHandler(IApplicationDbContext context, IDateTimeProvider dateTime)
    {
        _context = context;
        _dateTime = dateTime;
    }

    public async Task<Guid> Handle(LogVitalSignCommand request, CancellationToken cancellationToken)
    {
        var vital = request.Adapt<VitalSign>();
        vital.VitalId = Guid.NewGuid();
        vital.RecordedAt = _dateTime.UtcNow;

        _context.VitalSigns.Add(vital);
        await _context.SaveChangesAsync(cancellationToken);

        return vital.VitalId;
    }
}
