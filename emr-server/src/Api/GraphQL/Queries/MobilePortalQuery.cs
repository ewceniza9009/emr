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

    [UsePatientAccess]
    public async Task<IEnumerable<VitalSign>> GetMyMobileVitals(
        Guid patientId,
        [Service] Application.Common.Interfaces.IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return await context.VitalSigns
            .IgnoreQueryFilters()
            .Include(v => v.Encounter)
            .Where(v => v.Encounter.PatientId == patientId)
            .OrderByDescending(v => v.RecordedAt)
            .Take(30)
            .ToListAsync(cancellationToken);
    }

    [UsePatientAccess]
    public async Task<IEnumerable<ClinicalEncounter>> GetMyMobileEncounters(
        Guid patientId,
        [Service] Application.Common.Interfaces.IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return await context.ClinicalEncounters
            .IgnoreQueryFilters()
            .Include(e => e.Practitioner)
            .Where(e => e.PatientId == patientId)
            .OrderByDescending(e => e.EncounterDate)
            .ToListAsync(cancellationToken);
    }

    [UsePatientAccess]
    public async Task<IEnumerable<EsasAssessment>> GetMyMobileEsasHistory(
        Guid patientId,
        [Service] Application.Common.Interfaces.IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return await context.EsasAssessments
            .IgnoreQueryFilters()
            .Where(e => e.PatientId == patientId)
            .OrderByDescending(e => e.AssessedAt)
            .ToListAsync(cancellationToken);
    }
}
