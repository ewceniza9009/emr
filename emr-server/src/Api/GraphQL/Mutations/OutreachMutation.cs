using Application.Outreach.Commands;
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
}
