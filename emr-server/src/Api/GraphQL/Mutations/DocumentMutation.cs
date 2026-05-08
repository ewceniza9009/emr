using Application.Common.Interfaces;
using Application.Documents.Commands;
using Domain.Enums;
using HotChocolate.Authorization;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Infrastructure.Identity;
using HotChocolate.Types;
using Domain.Common;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
[Authorize(Policy = "CanEditPatients")]
public class DocumentMutation
{
    public DocumentMutation()
    {
    }

    public async Task<bool> DeleteDocument(
        Guid patientDocumentId,
        [Service] IStorageService storageService,
        [Service] IApplicationDbContext context,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] ICurrentUserService currentUserService,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        var document = await context.PatientDocuments
            .FirstOrDefaultAsync(d => d.PatientDocumentId == patientDocumentId, cancellationToken);

        if (document == null) return false;

        if (!await VerifyClinicalAccess(document.PatientId, currentUserService, userManager, context, cancellationToken))
            throw new UnauthorizedAccessException("Clinical assignment required for document removal.");

        // Delete from Storage
        if (!string.IsNullOrEmpty(document.StorageUrl))
        {
            await storageService.DeleteFileAsync(document.StorageUrl, cancellationToken);
        }

        // Delete from DB
        context.PatientDocuments.Remove(document);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogActionAsync("PATIENT_DOCUMENT_REMOVED", $"Document purged: {document.Title}", document.PatientId.ToString());
        return true;
    }

    private async Task<bool> VerifyClinicalAccess(
        Guid patientId, 
        ICurrentUserService currentUserService,
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context,
        CancellationToken cancellationToken)
    {
        var userIdStr = currentUserService.UserId;
        if (string.IsNullOrEmpty(userIdStr)) return false;

        var user = await userManager.FindByIdAsync(userIdStr);
        if (user == null) return false;

        // 1. Role-Based Overrides (Aligned with DependencyInjection.cs isAdmin logic)
        if (await userManager.IsInRoleAsync(user, Roles.Admin) || 
            await userManager.IsInRoleAsync(user, "Administrator") ||
            await userManager.IsInRoleAsync(user, "System Admin") ||
            await userManager.IsInRoleAsync(user, Roles.MedicalDirector)) 
        {
            return true;
        }

        // 2. Break Glass / Emergency Protocol
        if (user.EmergencyAccessExpiry > DateTimeOffset.UtcNow) return true;

        if (!Guid.TryParse(userIdStr, out var userId)) return false;
        
        var isAssigned = await context.CareNavigationCases.AnyAsync(
            c => c.PatientId == patientId && c.NavigatorId == userId && c.Status == CaseStatus.Open, 
            cancellationToken);
            
        if (isAssigned) return true;

        var hasAppointment = await context.Appointments.AnyAsync(
            a => a.PatientId == patientId && a.PractitionerId == userId, 
            cancellationToken);
            
        return hasAppointment;
    }

    public async Task<Guid> UploadDocument(
        Guid patientId,
        Guid? patientContactId,
        string title,
        string documentType,
        IFile file,
        [Service] IMediator mediator,
        [Service] ICurrentUserService currentUserService,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] IApplicationDbContext context,
        [Service] ISecurityAuditService auditService,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(patientId, currentUserService, userManager, context, cancellationToken))
            throw new UnauthorizedAccessException("Clinical assignment required for document ingestion.");

        var result = await mediator.Send(new UploadDocumentCommand(
            patientId,
            patientContactId,
            title,
            documentType,
            file.OpenReadStream(),
            file.Name,
            file.ContentType,
            file.Length ?? 0
        ), cancellationToken);

        await auditService.LogActionAsync("PATIENT_DOCUMENT_UPLOADED", $"New document ingested: {title}", patientId.ToString());
        return result;
    }
}
