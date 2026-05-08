using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record DeleteAppointmentCommand(Guid AppointmentId) : IRequest<bool>;

public class DeleteAppointmentCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteAppointmentCommand, bool>
{
    public async Task<bool> Handle(DeleteAppointmentCommand request, CancellationToken cancellationToken)
    {
        var appointment = await context.Appointments
            .FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId, cancellationToken);

        if (appointment == null) return false;

        context.Appointments.Remove(appointment);
        await context.SaveChangesAsync(cancellationToken);
        
        return true;
    }
}
