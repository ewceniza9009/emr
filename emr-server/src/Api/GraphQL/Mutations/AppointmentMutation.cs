using Application.Appointments.Commands;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class AppointmentMutation
{
    public async Task<Appointment> BookAppointment(
        BookAppointmentInput input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(new BookAppointmentCommand(
            input.PatientId,
            input.PractitionerId,
            input.SupportingPractitionerIds,
            input.ScheduledStart,
            input.ScheduledEnd,
            input.Modality,
            null, // TravelTimeMinutes
            null, // DistanceInMiles
            input.AppointmentId), cancellationToken);
    }

    public async Task<Appointment> RescheduleAppointment(
        Guid appointmentId,
        DateTimeOffset newStart,
        DateTimeOffset newEnd,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(new RescheduleAppointmentCommand(
            appointmentId,
            newStart,
            newEnd), cancellationToken);
    }

    public async Task<ScheduleBlock> UpdateScheduleBlock(
        Guid blockId,
        DateTimeOffset newStart,
        DateTimeOffset newEnd,
        [Service] IMediator mediator,
        CancellationToken cancellationToken)
    {
        return await mediator.Send(new UpdateScheduleBlockCommand(
            blockId,
            newStart,
            newEnd), cancellationToken);
    }
}

public record BookAppointmentInput(
    Guid PatientId,
    Guid PractitionerId,
    List<Guid> SupportingPractitionerIds,
    DateTimeOffset ScheduledStart,
    DateTimeOffset ScheduledEnd,
    AppointmentModality Modality,
    Guid? AppointmentId = null);
