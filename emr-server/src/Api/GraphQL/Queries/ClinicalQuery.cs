using Application.Clinical.Dtos;
using Application.Clinical.Queries;
using Application.Clinical.Services;
using Application.Common.Models;
using Domain.Entities;
using HotChocolate.Authorization;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Api.GraphQL.Attributes;
using Application.Common.Interfaces;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanViewPatients")]
public class ClinicalQuery
{
    private readonly ISecurityAuditService _auditService;

    public ClinicalQuery(ISecurityAuditService auditService)
    {
        _auditService = auditService;
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("encountersByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<ClinicalEncounter>> GetEncountersByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        await _auditService.LogActionAsync(
            "CLINICAL_HISTORY_VIEWED",
            "Patient clinical encounter history accessed.",
            patientId.ToString()
        );

        return context
            .ClinicalEncounters.Include(e => e.Practitioner)
            .Include(e => e.ClinicalNotes)
            .Include(e => e.VitalSigns)
            .Include(e => e.AssessmentResponses)
                .ThenInclude(r => r.Questionnaire)
            .AsNoTracking()
            .Where(e => e.PatientId == patientId);
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("vitalSignsByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<VitalSign>> GetVitalSignsByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .VitalSigns.Include(v => v.Encounter)
            .AsNoTracking()
            .Where(v => v.Encounter.PatientId == patientId);
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("esasHistoryByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<EsasAssessment>> GetEsasHistoryByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context.EsasAssessments.AsNoTracking().Where(e => e.PatientId == patientId);
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("equipmentDeliveriesByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<EquipmentDelivery>> GetEquipmentDeliveriesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .EquipmentDeliveries.Include(x => x.Equipment)
            .AsNoTracking()
            .Where(e => e.PatientId == patientId);
    }

    [GraphQLName("patientClinicalSummary")]
    [UseClinicalAccess]
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
    [GraphQLName("triageWorklist")]
    public async Task<PagedResponse<TriageItemDto>> GetTriageWorklist(
        string? search,
        bool? isAlert,
        List<string>? directiveTypes,
        int skip = 0,
        int take = 50,
        [Service] IMediator mediator = default!,
        CancellationToken cancellationToken = default
    )
    {
        return await mediator.Send(
            new GetTriageWorklistQuery(search, skip, take, isAlert, directiveTypes),
            cancellationToken
        );
    }

    public IQueryable<SmartPhrase> GetSmartPhrases([Service] IApplicationDbContext context)
    {
        return context.SmartPhrases.AsNoTracking();
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("spiritualAssessmentsByEncounter")]
    [UseClinicalAccess(argumentName: "encounterId", source: ClinicalIdSource.Encounter)]
    public async Task<IQueryable<SpiritualAssessment>> GetSpiritualAssessmentsByEncounter(
        Guid encounterId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .SpiritualAssessments
            .AsNoTracking()
            .Where(r => r.EncounterId == encounterId);
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("advanceDirectivesByPatient")]
    [UseClinicalAccess]
    public async Task<IQueryable<AdvanceDirective>> GetAdvanceDirectivesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .AdvanceDirectives
            .AsNoTracking()
            .Where(r => r.PatientId == patientId);
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("assessmentResponsesByEncounter")]
    [UseClinicalAccess(argumentName: "encounterId", source: ClinicalIdSource.Encounter)]
    public async Task<IQueryable<AssessmentResponse>> GetAssessmentResponsesByEncounter(
        Guid encounterId,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        return context
            .AssessmentResponses
            .Include(r => r.Questionnaire)
                .ThenInclude(q => q.Questions)
            .Include(r => r.Assessor)
            .AsNoTracking()
            .Where(r => r.EncounterId == encounterId);
    }

    [GraphQLName("searchDiagnosisLibrary")]
    public async Task<List<Diagnosis>> SearchDiagnosisLibrary(
        string term,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(term))
            return new List<Diagnosis>();

        var lowerTerm = term.ToLower();

        return await context
            .Diagnoses.AsNoTracking()
            .Where(d =>
                d.Icd10Code.ToLower().Contains(lowerTerm)
                || d.Description.ToLower().Contains(lowerTerm)
            )
            .GroupBy(d => new { d.Icd10Code, d.Description })
            .Select(g => new Diagnosis { Icd10Code = g.Key.Icd10Code, Description = g.Key.Description })
            .Take(10)
            .ToListAsync(cancellationToken);
    }
}
