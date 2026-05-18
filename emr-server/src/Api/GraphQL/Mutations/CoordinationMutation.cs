using Application.Common.Interfaces;
using Application.Coordination.Commands;
using Domain.Common;
using Domain.Enums;
using HotChocolate;
using HotChocolate.Authorization;
using Infrastructure.Identity;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class CoordinationMutation
{
    private async Task<bool> VerifyClinicalAccess(
        Guid patientId,
        ICurrentUserService currentUserService,
        IApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken
    )
    {
        var userIdStr = currentUserService.UserId;
        if (string.IsNullOrEmpty(userIdStr))
            return false;

        var user = await userManager.FindByIdAsync(userIdStr);
        if (user == null)
            return false;

        // 1. Role-Based Overrides (Aligned with DependencyInjection.cs isAdmin logic)
        if (
            await userManager.IsInRoleAsync(user, Roles.Admin)
            || await userManager.IsInRoleAsync(user, "Administrator")
            || await userManager.IsInRoleAsync(user, "System Admin")
            || await userManager.IsInRoleAsync(user, Roles.MedicalDirector)
        )
        {
            return true;
        }

        if (user.EmergencyAccessExpiry > DateTimeOffset.UtcNow)
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

    [Authorize(Policy = "CanEditPatients")]
    public async Task<Guid> UpdateAdvanceDirective(
        UpdateAdvanceDirectiveCommand command,
        [Service] IMediator mediator,
        [Service] ISecurityAuditService auditService,
        [Service] ICurrentUserService currentUserService,
        [Service] IApplicationDbContext context,
        [Service] UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(command.PatientId, currentUserService, context, userManager, cancellationToken))
            throw new UnauthorizedAccessException("Clinical assignment required for modification.");

        var result = await mediator.Send(command, cancellationToken);
        await auditService.LogActionAsync(
            "PATIENT_DIRECTIVE_UPDATED",
            $"Advance directive updated: {command.Type}",
            command.PatientId.ToString()
        );
        return result;
    }

    [Authorize(Policy = "CanEditPatients")]
    public async Task<Domain.Entities.ChatMessage> SendNavigatorChatMessage(
        Guid patientId,
        Guid careThreadId,
        string content,
        [Service] ISecurityAuditService auditService,
        [Service] ICurrentUserService currentUserService,
        [Service] IApplicationDbContext context,
        [Service] UserManager<ApplicationUser> userManager,
        [Service] Microsoft.AspNetCore.SignalR.IHubContext<Infrastructure.Hubs.ChatHub> hubContext,
        CancellationToken cancellationToken
    )
    {
        if (!await VerifyClinicalAccess(patientId, currentUserService, context, userManager, cancellationToken))
            throw new UnauthorizedAccessException("Clinical assignment required for modification.");

        var thread = await context
            .CareThreads.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.CareThreadId == careThreadId, cancellationToken);

        if (thread == null)
            throw new ArgumentException("Care thread not found.");

        var message = new Domain.Entities.ChatMessage
        {
            CareThreadId = careThreadId,
            TenantId = thread.TenantId,
            SenderRole = "navigator",
            Content = content,
            Timestamp = DateTimeOffset.UtcNow,
            IsAttachment = false,
        };

        context.ChatMessages.Add(message);
        await context.SaveChangesAsync(cancellationToken);

        await hubContext
            .Clients.Group($"CareThread_{careThreadId}")
            .SendAsync("ReceiveMessage", new {
                chatMessageId = message.ChatMessageId,
                careThreadId = message.CareThreadId,
                senderRole = message.SenderRole,
                content = message.Content,
                timestamp = message.Timestamp,
                isAttachment = message.IsAttachment
            }, cancellationToken);
        await auditService.LogActionAsync(
            "NAVIGATOR_CHAT_SENT",
            "Sent secure message",
            patientId.ToString()
        );

        return message;
    }
}
