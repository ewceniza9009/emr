using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Application.Appointments.Commands;

public record CreateScheduleBlockCommand(
    Guid PractitionerId,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    ScheduleBlockStatus Status = ScheduleBlockStatus.Blocked
) : IRequest<ScheduleBlock>;

public class CreateScheduleBlockCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateScheduleBlockCommand, ScheduleBlock>
{
    public async Task<ScheduleBlock> Handle(
        CreateScheduleBlockCommand request,
        CancellationToken cancellationToken
    )
    {
        var block = new ScheduleBlock
        {
            BlockId = Guid.NewGuid(),
            PractitionerId = request.PractitionerId,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = request.Status
        };

        context.ScheduleBlocks.Add(block);
        await context.SaveChangesAsync(cancellationToken);

        return block;
    }
}
