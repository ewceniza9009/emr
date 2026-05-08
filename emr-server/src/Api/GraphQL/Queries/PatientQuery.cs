using Application.Common.Interfaces;
using Application.Patients.Dtos;
using Application.Patients.Queries;
using Domain.Entities;
using Domain.Enums;
using HotChocolate.Authorization;
using Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanViewPatients")]
public class PatientQuery
{
    private readonly ICurrentUserService _currentUserService;

    public PatientQuery(ICurrentUserService currentUserService)
    {
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

    public async Task<PatientDto?> GetPatientById(
        Guid patientId,
        [Service] IMediator mediator,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(patientId, userManager, context, cancellationToken))
            throw new UnauthorizedAccessException("Clinical access required.");

        return await mediator.Send(new GetPatientByIdQuery(patientId), cancellationToken);
    }

    public async Task<Application.Common.Models.PagedResponse<PatientDto>> GetPatients(
        [Service] IMediator mediator,
        string? search = null,
        int skip = 0,
        int take = 50,
        CancellationToken cancellationToken = default
    )
    {
        return await mediator.Send(new GetPatientsQuery(search, skip, take), cancellationToken);
    }

    public IQueryable<Prescription> GetPrescriptionsByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context
            .Prescriptions.Include(x => x.Medication)
            .AsNoTracking()
            .Where(x => x.PatientId == patientId);
    }

    public IQueryable<Diagnosis> GetDiagnosesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.Diagnoses.AsNoTracking().Where(x => x.PatientId == patientId);
    }

    public IQueryable<Allergy> GetAllergiesByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.Allergies.AsNoTracking().Where(x => x.PatientId == patientId);
    }

    public IQueryable<PatientDocument> GetDocumentsByPatient(
        Guid patientId,
        [Service] IApplicationDbContext context
    )
    {
        return context.PatientDocuments.AsNoTracking().Where(x => x.PatientId == patientId);
    }
}
