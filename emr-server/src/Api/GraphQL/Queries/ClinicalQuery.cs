using Application.Clinical.Dtos;
using Application.Clinical.Queries;
using Application.Clinical.Services;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using Infrastructure.Identity;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanViewPatients")]
public class ClinicalQuery
{
    private readonly ISecurityAuditService _auditService;
    private readonly ICurrentUserService _currentUserService;

    public ClinicalQuery(ISecurityAuditService auditService, ICurrentUserService currentUserService)
    {
        _auditService = auditService;
        _currentUserService = currentUserService;
    }

    private async Task<bool> VerifyClinicalAccess(
        Guid patientId,
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var userIdStr = _currentUserService.UserId;
        if (string.IsNullOrEmpty(userIdStr))
            return false;

        var user = await userManager.FindByIdAsync(userIdStr);
        if (user == null)
            return false;

        if (user.EmergencyAccessExpiry > DateTimeOffset.UtcNow)
            return true;

        var roles = await userManager.GetRolesAsync(user);
        if (
            roles.Contains("Administrator")
            || roles.Contains("System Admin")
            || roles.Contains("Admin")
        )
            return true;

        if (!Guid.TryParse(userIdStr, out var userId))
            return false;

        var isAssigned = await context.CareNavigationCases.AnyAsync(
            c => c.PatientId == patientId && c.NavigatorId == userId && c.Status == CaseStatus.Open,
            cancellationToken
        );

        if (isAssigned)
            return true;

        var hasAppointment = await context.Appointments.AnyAsync(
            a => a.PatientId == patientId && a.PractitionerId == userId,
            cancellationToken
        );

        return hasAppointment;
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("encountersByPatient")]
    public async Task<IQueryable<ClinicalEncounter>> GetEncountersByPatient(
        Guid patientId,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(patientId, userManager, context, cancellationToken))
            throw new UnauthorizedAccessException("Clinical context verification failed.");

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
    public async Task<IQueryable<VitalSign>> GetVitalSignsByPatient(
        Guid patientId,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(patientId, userManager, context, cancellationToken))
            throw new UnauthorizedAccessException("Clinical context verification failed.");

        return context
            .VitalSigns.Include(v => v.Encounter)
            .AsNoTracking()
            .Where(v => v.Encounter.PatientId == patientId);
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("esasHistoryByPatient")]
    public async Task<IQueryable<EsasAssessment>> GetEsasHistoryByPatient(
        Guid patientId,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(patientId, userManager, context, cancellationToken))
            throw new UnauthorizedAccessException("Clinical context verification failed.");

        return context.EsasAssessments.AsNoTracking().Where(e => e.PatientId == patientId);
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("equipmentDeliveriesByPatient")]
    public async Task<IQueryable<EquipmentDelivery>> GetEquipmentDeliveriesByPatient(
        Guid patientId,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(patientId, userManager, context, cancellationToken))
            throw new UnauthorizedAccessException("Clinical context verification failed.");

        return context
            .EquipmentDeliveries.Include(x => x.Equipment)
            .AsNoTracking()
            .Where(e => e.PatientId == patientId);
    }

    [GraphQLName("patientClinicalSummary")]
    public async Task<PatientClinicalSummaryDto> GetPatientClinicalSummary(
        Guid patientId,
        [Service] IMediator mediator,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(patientId, userManager, context, cancellationToken))
            throw new UnauthorizedAccessException("Clinical context verification failed.");

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
        [Service] IMediator mediator,
        CancellationToken cancellationToken,
        int skip = 0,
        int take = 50
    )
    {
        return await mediator.Send(
            new GetTriageWorklistQuery(search, skip, take),
            cancellationToken
        );
    }

    public IQueryable<SmartPhrase> GetSmartPhrases([Service] IApplicationDbContext context)
    {
        return context.SmartPhrases.AsNoTracking();
    }

    [UseFiltering]
    [UseSorting]
    [GraphQLName("assessmentResponsesByEncounter")]
    public async Task<IQueryable<AssessmentResponse>> GetAssessmentResponsesByEncounter(
        Guid? encounterId,
        Guid? appointmentId,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        Guid? targetEncounterId = encounterId;

        if (targetEncounterId == null && appointmentId != null)
        {
            var encounter = await context.ClinicalEncounters
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.AppointmentId == appointmentId, cancellationToken);
            
            targetEncounterId = encounter?.EncounterId;
        }

        if (targetEncounterId == null)
            return Enumerable.Empty<AssessmentResponse>().AsQueryable();

        var encounterData = await context.ClinicalEncounters
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.EncounterId == targetEncounterId, cancellationToken);

        if (encounterData == null)
            return Enumerable.Empty<AssessmentResponse>().AsQueryable();

        if (!await VerifyClinicalAccess(encounterData.PatientId, userManager, context, cancellationToken))
            throw new UnauthorizedAccessException("Clinical context verification failed.");

        return context
            .AssessmentResponses.Include(r => r.Questionnaire)
            .AsNoTracking()
            .Where(r => r.EncounterId == targetEncounterId);
    }
}
