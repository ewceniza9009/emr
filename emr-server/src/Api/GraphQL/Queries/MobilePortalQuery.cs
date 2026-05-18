using Api.GraphQL.Attributes;
using Application.Patients.Dtos;
using Application.Patients.Queries;
using HotChocolate;
using HotChocolate.Types;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class MobilePortalQuery
{
    /// <summary>
    /// Fetches the patient's own profile. Secured by UsePatientAccess.
    /// The mobile app passes the patientId, but the attribute ensures it exactly matches the JWT token!
    /// </summary>
    [UsePatientAccess]
    public async Task<PatientDto?> GetMyMobileProfile(
        Guid patientId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(new GetPatientByIdQuery(patientId), cancellationToken);
    }

    [UsePatientAccess]
    public async Task<IEnumerable<Prescription>> GetMyMobilePrescriptions(
        Guid patientId,
        Api.GraphQL.DataLoaders.PrescriptionsByPatientIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(patientId, cancellationToken);
    }

    [UsePatientAccess]
    public async Task<IEnumerable<CareThread>> GetMyMobileChatThreads(
        Guid patientId,
        [Service] Application.Common.Interfaces.IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return await context.CareThreads
            .Include(t => t.Messages)
            .Where(t => t.PatientId == patientId && t.IsActive)
            .ToListAsync(cancellationToken);
    }
}
