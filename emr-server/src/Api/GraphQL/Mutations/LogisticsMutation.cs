using Application.Logistics.Commands;
using HotChocolate.Authorization;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class LogisticsMutation
{
    [Authorize(Policy = "CanManageLogistics")]
    public async Task<Guid> RegisterEquipment(
        RegisterEquipmentCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }

    [Authorize(Policy = "CanManageLogistics")]
    public async Task<Guid> RequestEquipmentDeployment(
        RequestEquipmentDeploymentCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        try
        {
            return await mediator.Send(input, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            throw new HotChocolate.GraphQLException(ex.Message);
        }
    }

    [Authorize(Policy = "CanManageLogistics")]
    public async Task<bool> UpdateDeploymentStatus(
        UpdateDeploymentStatusCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }
}
