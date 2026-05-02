using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class DashboardQuery
{
    public async Task<DashboardStatsDto> GetDashboardStats(
        [Service] IApplicationDbContext context)
    {
        // 1. Active Patients (Total in system)
        var patientCount = await context.Patients.CountAsync();
        
        // 2. New Encounters (Appointments scheduled for today)
        var today = new DateTimeOffset(DateTimeOffset.UtcNow.Date, TimeSpan.Zero);
        var appointmentCount = await context.Appointments
            .Where(a => a.ScheduledStart >= today && a.ScheduledStart < today.AddDays(1))
            .CountAsync();
        
        // 3. Pending Reviews (Mocking logic based on unvalidated clinical notes if table exists)
        // For now, let's just use some deterministic logic based on seeded data
        var pendingReviews = 12; // Placeholder but we could query clinical_notes
        
        // 4. Critical Alerts (Placeholder for IoT/Telemetry)
        var criticalAlerts = 3;

        return new DashboardStatsDto
        {
            ActivePatients = patientCount,
            NewEncounters = appointmentCount,
            PendingReviews = pendingReviews,
            CriticalAlerts = criticalAlerts
        };
    }
}

public class DashboardStatsDto
{
    public int ActivePatients { get; set; }
    public int NewEncounters { get; set; }
    public int PendingReviews { get; set; }
    public int CriticalAlerts { get; set; }
}
