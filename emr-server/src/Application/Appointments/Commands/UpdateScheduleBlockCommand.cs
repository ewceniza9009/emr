using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record UpdateScheduleBlockCommand(
    Guid BlockId,
    DateTimeOffset NewStart,
    DateTimeOffset NewEnd) : IRequest<ScheduleBlock>;

public class UpdateScheduleBlockCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateScheduleBlockCommand, ScheduleBlock>
{
    public async Task<ScheduleBlock> Handle(UpdateScheduleBlockCommand request, CancellationToken cancellationToken)
    {
        var block = await context.ScheduleBlocks
            .FirstOrDefaultAsync(b => b.BlockId == request.BlockId, cancellationToken);

        if (block == null)
        {
            throw new Exception("Schedule block not found");
        }

        block.StartTime = request.NewStart;
        block.EndTime = request.NewEnd;

        await context.SaveChangesAsync(cancellationToken);

        return block;
    }
}
