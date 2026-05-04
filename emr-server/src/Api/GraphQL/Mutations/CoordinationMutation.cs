using Application.Coordination.Commands;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class CoordinationMutation
{
    public async Task<Guid> UpdateAdvanceDirective(
        UpdateAdvanceDirectiveCommand command,
        [Service] IMediator mediator
    )
    {
        return await mediator.Send(command);
    }
}
