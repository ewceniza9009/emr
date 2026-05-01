using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Appointments.Commands;

public record BookAppointmentCommand(
    Guid PatientId,
    Guid PractitionerId,
    List<Guid> SupportingPractitionerIds,
    DateTimeOffset ScheduledStart,
    DateTimeOffset ScheduledEnd,
    AppointmentModality Modality,
    double? TravelTimeMinutes = null,
    double? DistanceInMiles = null) : IRequest<Appointment>;

public class BookAppointmentCommandHandler(IApplicationDbContext context) : IRequestHandler<BookAppointmentCommand, Appointment>
{
    public async Task<Appointment> Handle(BookAppointmentCommand request, CancellationToken cancellationToken)
    {
        var supporting = await context.Practitioners
            .Where(p => request.SupportingPractitionerIds.Contains(p.PractitionerId))
            .ToListAsync(cancellationToken);

        var appointment = new Appointment
        {
            AppointmentId = Guid.NewGuid(),
            PatientId = request.PatientId,
            PractitionerId = request.PractitionerId,
            ScheduledStart = request.ScheduledStart,
            ScheduledEnd = request.ScheduledEnd,
            Modality = request.Modality,
            Status = AppointmentStatus.Scheduled,
            SupportingClinicians = supporting,
            TravelTimeMinutes = request.TravelTimeMinutes,
            DistanceInMiles = request.DistanceInMiles
        };

        context.Appointments.Add(appointment);
        await context.SaveChangesAsync(cancellationToken);

        return appointment;
    }
}
