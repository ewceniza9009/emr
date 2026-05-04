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
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(
            new BookAppointmentCommand(
                input.PatientId,
                input.PractitionerId,
                input.SupportingPractitionerIds,
                input.ScheduledStart,
                input.ScheduledEnd,
                input.Modality,
                null, // TravelTimeMinutes
                null, // DistanceInMiles
                input.AppointmentId
            ),
            cancellationToken
        );
    }

    public async Task<Appointment> RescheduleAppointment(
        RescheduleAppointmentInput input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(
            new RescheduleAppointmentCommand(input.AppointmentId, input.NewStart, input.NewEnd),
            cancellationToken
        );
    }

    public async Task<ScheduleBlock> UpdateScheduleBlock(
        UpdateScheduleBlockInput input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(
            new UpdateScheduleBlockCommand(input.BlockId, input.NewStart, input.NewEnd),
            cancellationToken
        );
    }
}

public record BookAppointmentInput(
    Guid PatientId,
    Guid PractitionerId,
    List<Guid> SupportingPractitionerIds,
    DateTimeOffset ScheduledStart,
    DateTimeOffset ScheduledEnd,
    AppointmentModality Modality,
    Guid? AppointmentId = null
);

public record RescheduleAppointmentInput(
    Guid AppointmentId,
    DateTimeOffset NewStart,
    DateTimeOffset NewEnd
);

public record UpdateScheduleBlockInput(
    Guid BlockId,
    DateTimeOffset NewStart,
    DateTimeOffset NewEnd
);
