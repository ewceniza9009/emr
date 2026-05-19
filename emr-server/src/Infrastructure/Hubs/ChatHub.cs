using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Infrastructure.Hubs;

[Authorize]
public class ChatHub : Hub
{
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
        await Clients.Group($"CareThread_{careThreadId}").SendAsync("MessageSeen", careThreadId, senderRole);
    }
}
