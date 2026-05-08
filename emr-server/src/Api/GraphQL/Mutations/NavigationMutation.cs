using Application.Navigation.Commands;
using HotChocolate.Authorization;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanViewPatients")]
public class NavigationMutation
{
    public async Task<Guid> CreateCareNavigationCase(
        CreateCareNavigationCaseCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }
}
