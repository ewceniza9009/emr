using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace Infrastructure.Hubs;

public class TelemetryHub : Hub
{
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> StreamSubscribers = new(StringComparer.OrdinalIgnoreCase);
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> ConnectionStreams = new();

    public static IReadOnlyCollection<string> GetActivePatientStreams()
    {
        return StreamSubscribers
            .Where(kvp => !kvp.Value.IsEmpty)
            .Select(kvp => kvp.Key)
            .ToArray();
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectionStreams.TryRemove(Context.ConnectionId, out var streams))
        {
            foreach (var patientId in streams.Keys)
            {
                if (StreamSubscribers.TryGetValue(patientId, out var conns))
                {
                    conns.TryRemove(Context.ConnectionId, out _);
                    if (conns.IsEmpty)
                    {
                        StreamSubscribers.TryRemove(patientId, out _);
                    }
                }
            }
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinPatientStream(string patientId)
    {
        if (string.IsNullOrWhiteSpace(patientId)) return;
        var normalized = patientId.Trim();
        StreamSubscribers
            .GetOrAdd(normalized, _ => new ConcurrentDictionary<string, byte>())
            .TryAdd(Context.ConnectionId, 0);
        ConnectionStreams
            .GetOrAdd(Context.ConnectionId, _ => new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase))
            .TryAdd(normalized, 0);

        await Groups.AddToGroupAsync(Context.ConnectionId, normalized);
    }

    public async Task LeavePatientStream(string patientId)
    {
        if (string.IsNullOrWhiteSpace(patientId)) return;
        var normalized = patientId.Trim();
        if (StreamSubscribers.TryGetValue(normalized, out var conns))
        {
            conns.TryRemove(Context.ConnectionId, out _);
            if (conns.IsEmpty)
            {
                StreamSubscribers.TryRemove(normalized, out _);
            }
        }
        if (ConnectionStreams.TryGetValue(Context.ConnectionId, out var streams))
        {
            streams.TryRemove(normalized, out _);
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, normalized);
    }

    public async Task SendSymptomAlert(Guid patientId, string alertMessage)
    {
        await Clients.All.SendAsync("ReceiveAlert", patientId, alertMessage);
    }

    public async Task BroadcastTransitCoordinates(Guid patientId, decimal latitude, decimal longitude, decimal distanceToTargetMeters)
    {
        bool isMasked = distanceToTargetMeters <= 500;
        await Clients.Group(patientId.ToString()).SendAsync("ReceiveTransitCoordinates", new
        {
            patientId,
            latitude = isMasked ? 0 : latitude, // Mask exact coordinates when within 500m geofence
            longitude = isMasked ? 0 : longitude,
            isMasked,
            distance = distanceToTargetMeters
        });
    }
}
