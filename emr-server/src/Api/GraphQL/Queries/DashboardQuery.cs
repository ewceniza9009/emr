using Application.Common.Interfaces;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
[Authorize(Policy = "CanViewPatients")]
public class DashboardQuery
{
    public async Task<DashboardStatsDto> GetDashboardStats([Service] IApplicationDbContext context)
    {
        var tenantId = context.TenantConfigurations.Select(t => t.TenantId).FirstOrDefault();
        
        // 1. Active Patients (Total in system)
        var patientCount = await context.Patients.CountAsync();

        // 2. New Encounters (Appointments scheduled for today)
        var today = new DateTimeOffset(DateTimeOffset.UtcNow.Date, TimeSpan.Zero);
        var appointmentCount = await context
            .Appointments.Where(a =>
                a.ScheduledStart >= today && a.ScheduledStart < today.AddDays(1)
            )
            .CountAsync();

        // 3. Pending Reviews (Unsigned clinical notes)
        var pendingReviews = await context.ClinicalNotes
            .Where(n => !n.IsSigned)
            .CountAsync();

        // 4. Critical Alerts (Patients with Pain/Wellbeing > 7)
        var criticalAlerts = await context.Patients
            .Where(p => p.EsasAssessments
                .OrderByDescending(e => e.AssessedAt)
                .Take(1)
                .Any(e => e.Pain > 7 || e.Wellbeing > 7))
            .CountAsync();

        // 5. Deployed Equipment
        var equipmentCount = await context.EquipmentDeliveries
            .Where(d => d.Status == Domain.Enums.DeliveryStatus.Delivered)
            .CountAsync();

        // 6. Generate Real-time Alerts for sidebar
        var alerts = new List<AlertDto>();

        // Compliance: Find expiring licensures (next 30 days)
        var thirtyDaysFromNow = DateTimeOffset.UtcNow.AddDays(30);
        var expiringLicensures = await context.PractitionerLicensures
            .Include(l => l.Practitioner)
            .Where(l => l.IsActive && l.ExpiryDate <= thirtyDaysFromNow)
            .OrderBy(l => l.ExpiryDate)
            .Take(2)
            .ToListAsync();

        foreach (var l in expiringLicensures)
        {
            alerts.Add(new AlertDto
            {
                Type = "COMPLIANCE",
                Title = "Licensure Renewal",
                Subtitle = $"{l.Practitioner.FirstName} {l.Practitioner.LastName} credentials ({l.State}) expire in {(int)(l.ExpiryDate - DateTimeOffset.UtcNow).TotalDays} days.",
                Priority = (l.ExpiryDate - DateTimeOffset.UtcNow).TotalDays < 14 ? "CRITICAL" : "URGENT",
                ActionText = "Update Credentials"
            });
        }

        // Telemetry: Find critical patients
        var criticalPatients = await context.Patients
            .Where(p => p.EsasAssessments
                .OrderByDescending(e => e.AssessedAt)
                .Take(1)
                .Any(e => e.Pain > 7 || e.Wellbeing > 7))
            .OrderByDescending(p => p.CreatedAt)
            .Take(2)
            .ToListAsync();

        foreach (var p in criticalPatients)
        {
            alerts.Add(new AlertDto
            {
                Type = "TELEMETRY",
                Title = $"Critical Score: {p.Mrn}",
                Subtitle = $"Patient {p.LastName} has reported high symptom distress (> 7).",
                Priority = "CRITICAL",
                ActionText = "Execute Protocol"
            });
        }

        return new DashboardStatsDto
        {
            ActivePatients = patientCount,
            NewEncounters = appointmentCount,
            PendingReviews = pendingReviews,
            CriticalAlerts = criticalAlerts,
            DeployedEquipmentCount = equipmentCount,
            Alerts = alerts
        };
    }
}

public class AlertDto
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string ActionText { get; set; } = string.Empty;
}

public class DashboardStatsDto
{
    public int ActivePatients { get; set; }
    public int NewEncounters { get; set; }
    public int PendingReviews { get; set; }
    public int CriticalAlerts { get; set; }
    public int DeployedEquipmentCount { get; set; }
    public List<AlertDto> Alerts { get; set; } = new();
}
