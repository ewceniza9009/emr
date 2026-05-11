using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record DeleteAppointmentCommand(Guid AppointmentId) : IRequest<bool>;

public class DeleteAppointmentCommandHandler(IApplicationDbContext context, INotificationService notificationService)
    : IRequestHandler<DeleteAppointmentCommand, bool>
{
    public async Task<bool> Handle(DeleteAppointmentCommand request, CancellationToken cancellationToken)
    {
        var appointment = await context.Appointments
            .Include(a => a.Patient)
            .FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId, cancellationToken);

        if (appointment == null) return false;

        if (appointment.Status == Domain.Enums.AppointmentStatus.InProgress)
        {
            throw new InvalidOperationException("Cannot delete an appointment that is already in progress.");
        }

        var practitionerId = appointment.PractitionerId.ToString();
        var patientName = $"{appointment.Patient.FirstName} {appointment.Patient.LastName}";
        var startTime = appointment.ScheduledStart.ToString("MM/dd HH:mm");

        context.Appointments.Remove(appointment);
        await context.SaveChangesAsync(cancellationToken);

        // Notify practitioner
        await notificationService.SendUserNotificationAsync(
            practitionerId,
            "Appointment Cancelled",
            $"Your appointment with {patientName} on {startTime} has been removed from the schedule.",
            Domain.Enums.NotificationPriority.High
        );
        
        return true;
    }
}
