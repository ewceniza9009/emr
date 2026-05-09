using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record DeleteScheduleBlockCommand(Guid BlockId) : IRequest<bool>;

public class DeleteScheduleBlockCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteScheduleBlockCommand, bool>
{
    public async Task<bool> Handle(DeleteScheduleBlockCommand request, CancellationToken cancellationToken)
    {
        var block = await context.ScheduleBlocks
            .FirstOrDefaultAsync(b => b.BlockId == request.BlockId, cancellationToken);

        if (block == null) return false;

        context.ScheduleBlocks.Remove(block);
        await context.SaveChangesAsync(cancellationToken);
        
        return true;
    }
}
