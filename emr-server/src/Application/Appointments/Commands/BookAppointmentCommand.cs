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
    double? DistanceInMiles = null,
    List<AssessmentType>? PlannedAssessments = null,
    Guid? AppointmentId = null
) : IRequest<Appointment>;

public class BookAppointmentCommandHandler(IApplicationDbContext context)
    : IRequestHandler<BookAppointmentCommand, Appointment>
{
    public async Task<Appointment> Handle(
        BookAppointmentCommand request,
        CancellationToken cancellationToken
    )
    {
        // --- COLLISION PROOF GUARD ---
        // Check for any overlapping appointments for the same practitioner
        var hasConflict = await context.Appointments
            .AnyAsync(a => a.PractitionerId == request.PractitionerId 
                           && a.AppointmentId != request.AppointmentId
                           && request.ScheduledStart < a.ScheduledEnd 
                           && request.ScheduledEnd > a.ScheduledStart, 
                      cancellationToken);

        if (hasConflict)
        {
            throw new InvalidOperationException("Collision Detected: This practitioner already has an appointment scheduled during this time window.");
        }

        var supporting = await context
            .Practitioners.Where(p => request.SupportingPractitionerIds.Contains(p.PractitionerId))
            .ToListAsync(cancellationToken);

        Appointment appointment;
        if (request.AppointmentId.HasValue && request.AppointmentId.Value != Guid.Empty)
        {
            appointment =
                await context
                    .Appointments.Include(a => a.SupportingClinicians)
                    .FirstOrDefaultAsync(
                        a => a.AppointmentId == request.AppointmentId.Value,
                        cancellationToken
                    )
                ?? throw new KeyNotFoundException($"Appointment {request.AppointmentId} not found");

            appointment.PatientId = request.PatientId;
            appointment.PractitionerId = request.PractitionerId;
            appointment.ScheduledStart = request.ScheduledStart;
            appointment.ScheduledEnd = request.ScheduledEnd;
            appointment.Modality = request.Modality;
            appointment.SupportingClinicians = supporting;
            appointment.PlannedAssessments = request.PlannedAssessments ?? new();
            appointment.TravelTimeMinutes = request.TravelTimeMinutes;
            appointment.DistanceInMiles = request.DistanceInMiles;
        }
        else
        {
            appointment = new Appointment
            {
                AppointmentId = Guid.NewGuid(),
                PatientId = request.PatientId,
                PractitionerId = request.PractitionerId,
                ScheduledStart = request.ScheduledStart,
                ScheduledEnd = request.ScheduledEnd,
                Modality = request.Modality,
                Status = AppointmentStatus.Scheduled,
                SupportingClinicians = supporting,
                PlannedAssessments = request.PlannedAssessments ?? new(),
                TravelTimeMinutes = request.TravelTimeMinutes,
                DistanceInMiles = request.DistanceInMiles,
            };
            context.Appointments.Add(appointment);
        }

        await context.SaveChangesAsync(cancellationToken);
        return appointment;
    }
}
