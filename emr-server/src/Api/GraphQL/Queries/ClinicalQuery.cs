using Application.Clinical.Dtos;
using Application.Clinical.Queries;
using Application.Clinical.Services;
using Application.Common.Interfaces;
using Domain.Entities;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class ClinicalQuery
{
    // A direct EF Core query inside the GraphQL endpoint.
    // In a fully scaled system, this should also be moved to MediatR, but here we demonstrate
    // HotChocolate's direct IQueryable integration for high-performance projections.
    [UseFiltering]
    [UseSorting]
    public IQueryable<ClinicalEncounterDto> GetEncountersByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context
            .ClinicalEncounters.AsNoTracking()
            .Where(e => e.PatientId == patientId)
            .ProjectToType<ClinicalEncounterDto>();
    }

    [UseFiltering]
    [UseSorting]
    public IQueryable<EsasAssessment> GetEsasHistoryByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.EsasAssessments.AsNoTracking().Where(e => e.PatientId == patientId);
    }

    public async Task<Application.Common.Models.PagedResponse<TriageItemDto>> GetTriageWorklist(
        [Service] IMediator mediator,
        string? search = null,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default
    )
    {
        return await mediator.Send(
            new GetTriageWorklistQuery(search, skip, take),
            cancellationToken
        );
    }

    public async Task<List<string>> ValidatePrescription(
        Guid patientId,
        string medicationName,
        [Service] IConflictEngine conflictEngine,
        CancellationToken cancellationToken
    )
    {
        return await conflictEngine.CheckConflictsAsync(
            patientId,
            medicationName,
            cancellationToken
        );
    }

    public async Task<PatientClinicalSummaryDto> GetPatientClinicalSummary(
        Guid patientId,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(
            new GetPatientClinicalSummaryQuery(patientId),
            cancellationToken
        );
    }

    [UseFiltering]
    [UseSorting]
    public IQueryable<EquipmentDelivery> GetEquipmentDeliveriesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context
            .EquipmentDeliveries.Include(x => x.Equipment)
            .AsNoTracking()
            .Where(x => x.PatientId == patientId);
    }

    [UseFiltering]
    [UseSorting]
    public IQueryable<SmartPhrase> GetSmartPhrases([Service] IApplicationDbContext context)
    {
        return context.SmartPhrases.AsNoTracking().Where(p => p.IsActive);
    }
}
