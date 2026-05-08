using Application.Common.Interfaces;
using HotChocolate.Authorization;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanManageSetup")]
public class IntegrationMutation
{
    public async Task<bool> SyncAllPartners(
        [Service] IElationClient elationClient,
        [Service] ICareSourceClient careSourceClient,
        CancellationToken cancellationToken
    )
    {
        // 1. Sync demographics for a dummy patient
        await elationClient.SyncPatientDemographicsAsync(Guid.Empty, cancellationToken);

        // 2. Report metrics for a dummy period
        await careSourceClient.ReportPalliativeMetricsAsync(
            Guid.Empty,
            DateTimeOffset.UtcNow.AddDays(-30),
            DateTimeOffset.UtcNow,
            cancellationToken
        );

        return true;
    }
}
