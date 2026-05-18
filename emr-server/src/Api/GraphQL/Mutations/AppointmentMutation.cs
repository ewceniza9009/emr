using Api.GraphQL.Attributes;
using Application.Appointments.Commands;
using Domain.Entities;
using Domain.Enums;
using HotChocolate;
using HotChocolate.Authorization;
using HotChocolate.Resolvers;
using HotChocolate.Types;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class AppointmentMutation
{
    [Authorize(Policy = "CanManageScheduling")]
    [UseClinicalAccess(argumentName: "PatientId")]
    public async Task<Appointment?> BookAppointment(
        BookAppointmentInput input,
        [Service] IMediator mediator,
        IResolverContext context,
        CancellationToken cancellationToken
    )
    {
        var response = await mediator.Send(
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
                input.AppointmentId,
                input.OverrideLogistics,
                input.FacilityId
            ),
            cancellationToken
        );

        if (response.Error != null)
        {
            context.ReportError(response.Error);
            return null;
        }

        return response.Appointment;
    }

    [Authorize(Policy = "CanManageScheduling")]
    [UseClinicalAccess(argumentName: "AppointmentId", source: ClinicalIdSource.Appointment)]
    public async Task<Appointment?> RescheduleAppointment(
        RescheduleAppointmentInput input,
        [Service] IMediator mediator,
        IResolverContext context,
        CancellationToken cancellationToken
    )
    {
        var response = await mediator.Send(
            new RescheduleAppointmentCommand(
                input.AppointmentId,
                input.NewStart,
                input.NewEnd,
                input.RecalculateTravelTime
            ),
            cancellationToken
        );

        if (response.Error != null)
        {
            context.ReportError(response.Error);
            return null;
        }

        return response.Appointment;
    }

    [Authorize(Policy = "CanManageScheduling")]
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

    [Authorize(Policy = "CanManageScheduling")]
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

    [Authorize(Policy = "CanManageScheduling")]
    [UseClinicalAccess(argumentName: "id", source: ClinicalIdSource.Appointment)]
    public async Task<bool> DeleteAppointment(
        Guid id,
        [Service] IMediator mediator,
        IResolverContext context,
        CancellationToken cancellationToken
    )
    {
        var response = await mediator.Send(new DeleteAppointmentCommand(id), cancellationToken);
        if (response.Error != null)
        {
            context.ReportError(response.Error);
            return false;
        }
        return response.Success;
    }

    [Authorize(Policy = "CanManageScheduling")]
    public async Task<bool> DeleteScheduleBlock(
        Guid id,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(new DeleteScheduleBlockCommand(id), cancellationToken);
    }

    [Authorize(Policy = "CanManageScheduling")]
    [UseClinicalAccess(argumentName: "appointmentId", source: ClinicalIdSource.Appointment)]
    public async Task<Appointment> ReassignAppointment(
        Guid appointmentId,
        Guid practitionerId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(new ReassignAppointmentCommand(appointmentId, practitionerId), cancellationToken);
    }

    [Authorize(Policy = "CanManageScheduling")]
    [UseClinicalAccess(argumentName: "appointmentId", source: ClinicalIdSource.Appointment)]
    public async Task<Appointment?> UpdateAppointmentStatus(
        Guid appointmentId,
        AppointmentStatus status,
        [Service] IMediator mediator,
        IResolverContext context,
        CancellationToken cancellationToken
    )
    {
        var response = await mediator.Send(
            new UpdateAppointmentStatusCommand(appointmentId, status),
            cancellationToken
        );

        if (response.Error != null)
        {
            context.ReportError(response.Error);
            return null;
        }

        return response.Appointment;
    }
}

public record CreateScheduleBlockInput(
    Guid PractitionerId,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    ScheduleBlockStatus Status = ScheduleBlockStatus.Blocked
);

public record ReassignAppointmentInput(Guid AppointmentId, Guid PractitionerId, bool OverrideLogistics = false);

public record BookAppointmentInput(
    Guid PatientId,
    Guid PractitionerId,
    List<Guid> SupportingPractitionerIds,
    DateTimeOffset ScheduledStart,
    DateTimeOffset ScheduledEnd,
    AppointmentModality Modality,
    List<AssessmentType>? PlannedAssessments = null,
    Guid? AppointmentId = null,
    bool OverrideLogistics = false,
    Guid? FacilityId = null
);

public record RescheduleAppointmentInput(
    Guid AppointmentId,
    DateTimeOffset NewStart,
    DateTimeOffset NewEnd,
    bool RecalculateTravelTime = true
);

public record UpdateScheduleBlockInput(
    Guid BlockId,
    DateTimeOffset NewStart,
    DateTimeOffset NewEnd
);

public record UpdateAppointmentStatusInput(
    Guid AppointmentId,
    AppointmentStatus Status
);
