using Application.Outreach.Commands;
using HotChocolate;
using HotChocolate.Types;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class OutreachMutation
{
    public async Task<Guid> FinalizeEnrollment(
        FinalizeEnrollmentCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    public async Task<bool> UnenrollPatient(
        UnenrollPatientCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    public async Task<Guid> CreateOutreach(
        CreateOutreachCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    public async Task<Guid> LogOutreachActivity(
        LogOutreachActivityCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    public async Task<Guid> AddOutreachContact(
        AddOutreachContactCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    public async Task<bool> RemoveOutreachContact(
        RemoveOutreachContactCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    public async Task<bool> UpdateOutreachLead(
        UpdateOutreachLeadCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    public async Task<Guid> LogSpiritualAssessment(
        LogSpiritualAssessmentCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }

    public async Task<Guid> AddAdvanceDirective(
        AddAdvanceDirectiveCommand input,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(input);
    }
}
