using Api.GraphQL.DataLoaders;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Types;

namespace Api.GraphQL.Types;

[ExtendObjectType(typeof(PatientOutreach))]
public class OutreachType
{
    public async Task<IEnumerable<OutreachActivity>> GetActivities(
        [Parent] PatientOutreach outreach,
        ActivitiesByOutreachIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(outreach.PatientOutreachId, cancellationToken);
    }

    public async Task<IEnumerable<OutreachContact>> GetOtherContacts(
        [Parent] PatientOutreach outreach,
        ContactsByOutreachIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(outreach.PatientOutreachId, cancellationToken);
    }
}
