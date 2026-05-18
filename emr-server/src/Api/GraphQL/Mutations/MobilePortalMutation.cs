using Api.GraphQL.Attributes;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Types;
using Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading;
using System.Threading.Tasks;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class MobilePortalMutation
{
    [UsePatientAccess]
    public async Task<ChatMessage> SendMobileChatMessage(
        Guid patientId,
        Guid careThreadId,
        string content,
        [Service] IApplicationDbContext context,
        [Service] IHubContext<ChatHub> hubContext,
        CancellationToken cancellationToken
    )
    {
        var patient = await context.Patients
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.PatientId == patientId, cancellationToken);

        if (patient == null)
        {
            throw new ArgumentException("Patient not found.");
        }

        var tenantId = patient.TenantId;

        if (careThreadId == Guid.Empty)
        {
            var thread = new CareThread
            {
                CareThreadId = Guid.NewGuid(),
                TenantId = tenantId,
                PatientId = patientId,
                Subject = "Mobile Chat",
                IsActive = true
            };
            context.CareThreads.Add(thread);
            careThreadId = thread.CareThreadId;
        }

        var message = new ChatMessage
        {
            CareThreadId = careThreadId,
            TenantId = tenantId,
            SenderRole = "patient",
            Content = content,
            Timestamp = DateTimeOffset.UtcNow,
            IsAttachment = false
        };

        context.ChatMessages.Add(message);
        await context.SaveChangesAsync(cancellationToken);

        await hubContext.Clients.Group($"CareThread_{careThreadId}").SendAsync("ReceiveMessage", new {
            chatMessageId = message.ChatMessageId,
            careThreadId = message.CareThreadId,
            senderRole = message.SenderRole,
            content = message.Content,
            timestamp = message.Timestamp,
            isAttachment = message.IsAttachment
        }, cancellationToken);

        return message;
    }
}
