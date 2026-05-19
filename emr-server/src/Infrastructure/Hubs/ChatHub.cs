using Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IApplicationDbContext _context;

    public ChatHub(IApplicationDbContext context)
    {
        _context = context;
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public async Task JoinCareThread(string careThreadId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"CareThread_{careThreadId}");
    }

    public async Task LeaveCareThread(string careThreadId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"CareThread_{careThreadId}");
    }

    public async Task MarkAsSeen(string careThreadId, string senderRole)
    {
        if (Guid.TryParse(careThreadId, out var threadGuid))
        {
            var unreadMessages = await _context.ChatMessages
                .IgnoreQueryFilters()
                .Where(m => m.CareThreadId == threadGuid && m.SenderRole != senderRole && !m.IsSeen)
                .ToListAsync();

            if (unreadMessages.Any())
            {
                foreach (var msg in unreadMessages)
                {
                    msg.IsSeen = true;
                }
                await _context.SaveChangesAsync(default);
            }
        }

        await Clients.Group($"CareThread_{careThreadId}").SendAsync("MessageSeen", careThreadId, senderRole);
    }
}
