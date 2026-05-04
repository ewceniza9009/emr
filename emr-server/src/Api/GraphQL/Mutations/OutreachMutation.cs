using Application.Outreach.Commands;
using HotChocolate;
using HotChocolate.Types;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class OutreachMutation
{
    public async Task<Guid> FinalizeEnrollment(
        FinalizeEnrollmentCommand command,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(command);
    }

    public async Task<Guid> CreateOutreach(
        CreateOutreachCommand command,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(command);
    }

    public async Task<Guid> LogOutreachActivity(
        LogOutreachActivityCommand command,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(command);
    }

    public async Task<Guid> AddOutreachContact(
        AddOutreachContactCommand command,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(command);
    }

    public async Task<bool> RemoveOutreachContact(
        RemoveOutreachContactCommand command,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(command);
    }

    public async Task<bool> UpdateOutreachLead(
        UpdateOutreachLeadCommand command,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(command);
    }

    public async Task<Guid> LogSpiritualAssessment(
        LogSpiritualAssessmentCommand command,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(command);
    }

    public async Task<Guid> AddAdvanceDirective(
        AddAdvanceDirectiveCommand command,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(command);
    }
}
