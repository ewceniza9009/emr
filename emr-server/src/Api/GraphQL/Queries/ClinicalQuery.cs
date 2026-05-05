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
    [UseProjection]
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

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<EsasAssessment> GetEsasHistoryByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.EsasAssessments.AsNoTracking().Where(e => e.PatientId == patientId);
    }

    public async Task<List<TriageItemDto>> GetTriageWorklist(
        [Service] IApplicationDbContext context
    )
    {
        // Fetch all patients and their latest ESAS using navigation properties
        var triageItems = await context
            .Patients.AsNoTracking()
            .Select(p => new TriageItemDto
            {
                PatientId = p.PatientId,
                Mrn = p.Mrn,
                FirstName = p.FirstName,
                LastName = p.LastName,
                LatestPainScore = p
                    .EsasAssessments.OrderByDescending(e => e.AssessedAt)
                    .Select(e => e.Pain)
                    .FirstOrDefault(),
                LatestWellbeingScore = p
                    .EsasAssessments.OrderByDescending(e => e.AssessedAt)
                    .Select(e => e.Wellbeing)
                    .FirstOrDefault(),
                AdvanceDirectiveType =
                    p.AdvanceDirectives.Where(ad => ad.IsActive)
                        .Select(ad => ad.Type.ToString())
                        .FirstOrDefault()
                    ?? "None",
                IsAlert = p
                    .EsasAssessments.OrderByDescending(e => e.AssessedAt)
                    .Any(e => e.Pain > 7 || e.Wellbeing > 7),
            })
            .ToListAsync();

        return triageItems;
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

    [UseProjection]
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

    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<SmartPhrase> GetSmartPhrases(
        [Service] IApplicationDbContext context
    )
    {
        return context.SmartPhrases.AsNoTracking().Where(p => p.IsActive);
    }
}

public class TriageItemDto
{
    public Guid PatientId { get; set; }
    public string Mrn { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int LatestPainScore { get; set; }
    public int LatestWellbeingScore { get; set; }
    public string AdvanceDirectiveType { get; set; } = string.Empty;
    public bool IsAlert { get; set; }
}
