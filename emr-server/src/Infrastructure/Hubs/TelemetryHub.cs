using Microsoft.AspNetCore.SignalR;

namespace Infrastructure.Hubs;

public class TelemetryHub : Hub
{
    public async Task JoinPatientStream(string patientId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, patientId);
    }

    public async Task LeavePatientStream(string patientId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, patientId);
    }
}
