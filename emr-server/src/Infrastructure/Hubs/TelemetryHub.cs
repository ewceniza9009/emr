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

    public async Task BroadcastTransitCoordinates(Guid patientId, decimal latitude, decimal longitude, decimal distanceToTargetMeters)
    {
        bool isMasked = distanceToTargetMeters <= 500;
        await Clients.Group(patientId.ToString()).SendAsync("ReceiveTransitCoordinates", new {
            patientId,
            latitude = isMasked ? 0 : latitude, // Mask exact coordinates when within 500m geofence
            longitude = isMasked ? 0 : longitude,
            isMasked,
            distance = distanceToTargetMeters
        });
    }
}
