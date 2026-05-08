using Application.Appointments.Commands;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanManageScheduling")]
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
                input.PlannedAssessments,
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

    public async Task<ScheduleBlock> CreateScheduleBlock(
        CreateScheduleBlockInput input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(
            new CreateScheduleBlockCommand(
                input.PractitionerId,
                input.StartTime,
                input.EndTime,
                input.Status
            ),
            cancellationToken
        );
    }
    public async Task<bool> DeleteAppointment(
        Guid id,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(new DeleteAppointmentCommand(id), cancellationToken);
    }
}

public record CreateScheduleBlockInput(
    Guid PractitionerId,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    ScheduleBlockStatus Status = ScheduleBlockStatus.Blocked
);

public record BookAppointmentInput(
    Guid PatientId,
    Guid PractitionerId,
    List<Guid> SupportingPractitionerIds,
    DateTimeOffset ScheduledStart,
    DateTimeOffset ScheduledEnd,
    AppointmentModality Modality,
    List<AssessmentType> PlannedAssessments = null,
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
