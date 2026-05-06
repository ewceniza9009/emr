using Application.Logistics.Commands;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class LogisticsMutation
{
    public async Task<Guid> RegisterEquipment(
        RegisterEquipmentCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<Guid> RequestEquipmentDeployment(
        RequestEquipmentDeploymentCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    public async Task<bool> UpdateDeploymentStatus(
        UpdateDeploymentStatusCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }
}
