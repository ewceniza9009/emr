using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

public class TelemetryHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        // Example: Add user to a specific care navigator group based on context
        await base.OnConnectedAsync();
    }

    public async Task SendSymptomAlert(Guid patientId, string alertMessage)
    {
        await Clients.All.SendAsync("ReceiveAlert", patientId, alertMessage);
    }
}
