using Microsoft.AspNetCore.SignalR;

namespace Infrastructure.Hubs;

public class TelemetryHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public async Task JoinPatientStream(string patientId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, patientId);
    }

    public async Task LeavePatientStream(string patientId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, patientId);
    }

    public async Task SendSymptomAlert(Guid patientId, string alertMessage)
    {
        await Clients.All.SendAsync("ReceiveAlert", patientId, alertMessage);
    }
}
