using Application.Common.Interfaces;
using HotChocolate.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class DashboardQuery
{
    [Authorize(Policy = "CanViewPatients")]
    public async Task<DashboardStatsDto> GetDashboardStats(
        [Service] IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var now = DateTimeOffset.UtcNow;
        var today = new DateTimeOffset(now.Date, TimeSpan.Zero);

        var patientCount = await context.Patients.CountAsync(cancellationToken);

        var appointmentCount = await context
            .Appointments.Where(a => a.ScheduledStart >= today && a.ScheduledStart < today.AddDays(1))
            .CountAsync(cancellationToken);

        var pendingReviews = await context
            .ClinicalNotes.Where(n => !n.IsSigned)
            .CountAsync(cancellationToken);

        var equipmentCount = await context
            .EquipmentDeliveries.Where(d => d.Status == Domain.Enums.DeliveryStatus.Delivered)
            .CountAsync(cancellationToken);

        // Single query for critical ESAS patients (returns count + top 2 instead of running subquery twice)
        var criticalPatientsQuery = context.Patients
            .AsNoTracking()
            .Where(p =>
                p.EsasAssessments.OrderByDescending(e => e.AssessedAt)
                    .Select(e => (bool?)(e.Pain > 7 || e.Wellbeing > 7))
                    .FirstOrDefault() == true
            );

        var criticalAlerts = await criticalPatientsQuery.CountAsync(cancellationToken);
        var criticalPatients = criticalAlerts > 0
            ? await criticalPatientsQuery
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new { p.PatientId, p.Mrn, p.LastName })
                .Take(2)
                .ToListAsync(cancellationToken)
            : [];

        var alerts = new List<AlertDto>();
        var minValidExpiry = now.AddYears(-5);
        var thirtyDaysFromNow = now.AddDays(30);

        var expiringLicensures = await context
            .PractitionerLicensures
            .AsNoTracking()
            .Where(l => l.IsActive && l.ExpiryDate > minValidExpiry && l.ExpiryDate <= thirtyDaysFromNow)
            .OrderBy(l => l.ExpiryDate)
            .Select(l => new
            {
                l.PractitionerId,
                l.Practitioner.FirstName,
                l.Practitioner.LastName,
                l.State,
                l.ExpiryDate,
            })
            .Take(2)
            .ToListAsync(cancellationToken);

        foreach (var l in expiringLicensures)
        {
            var daysRemaining = (int)Math.Round((l.ExpiryDate - now).TotalDays);
            var stateLabel = string.IsNullOrWhiteSpace(l.State) ? string.Empty : $" ({l.State})";
            var expiryCopy = daysRemaining >= 0
                ? $"expire in {daysRemaining} days."
                : $"expired {Math.Abs(daysRemaining)} days ago.";

            alerts.Add(
                new AlertDto
                {
                    Type = "COMPLIANCE",
                    Title = "Licensure Renewal",
                    Subtitle = $"{l.FirstName} {l.LastName} credentials{stateLabel} {expiryCopy}",
                    Priority = daysRemaining < 14 ? "CRITICAL" : "URGENT",
                    ActionText = "Update Credentials",
                    TargetId = l.PractitionerId.ToString(),
                }
            );
        }

        foreach (var p in criticalPatients)
        {
            alerts.Add(
                new AlertDto
                {
                    Type = "TELEMETRY",
                    Title = $"Critical Score: {p.Mrn}",
                    Subtitle = $"Patient {p.LastName} has reported high symptom distress (> 7).",
                    Priority = "CRITICAL",
                    ActionText = "Execute Protocol",
                    TargetId = p.PatientId.ToString(),
                }
            );
        }

        // Operational Pulse: 2 queries total instead of 14 sequential queries in a loop
        var startTime = now.AddDays(-1);
        var endWindow = startTime.AddHours(28);

        var recentEncounterDates = await context.ClinicalEncounters
            .AsNoTracking()
            .Where(e => e.EncounterDate >= startTime && e.EncounterDate < endWindow)
            .Select(e => e.EncounterDate)
            .ToListAsync(cancellationToken);

        var recentAlertDates = await context.EsasAssessments
            .AsNoTracking()
            .Where(e => e.AssessedAt >= startTime && e.AssessedAt < endWindow && (e.Pain > 7 || e.Wellbeing > 7))
            .Select(e => e.AssessedAt)
            .ToListAsync(cancellationToken);

        var pulse = new List<OperationalPulseDto>(7);
        for (int i = 0; i <= 24; i += 4)
        {
            var pointTime = startTime.AddHours(i);
            var nextPoint = pointTime.AddHours(4);

            pulse.Add(
                new OperationalPulseDto
                {
                    Time = pointTime.ToString("HH:mm"),
                    Active = recentEncounterDates.Count(d => d >= pointTime && d < nextPoint),
                    Alerts = recentAlertDates.Count(d => d >= pointTime && d < nextPoint),
                }
            );
        }

        return new DashboardStatsDto
        {
            ActivePatients = patientCount,
            NewEncounters = appointmentCount,
            PendingReviews = pendingReviews,
            CriticalAlerts = criticalAlerts,
            DeployedEquipmentCount = equipmentCount,
            Alerts = alerts,
            Pulse = pulse,
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
    public string? TargetId { get; set; }
}

public class DashboardStatsDto
{
    public int ActivePatients { get; set; }
    public int NewEncounters { get; set; }
    public int PendingReviews { get; set; }
    public int CriticalAlerts { get; set; }
    public int DeployedEquipmentCount { get; set; }
    public List<AlertDto> Alerts { get; set; } = new();
    public List<OperationalPulseDto> Pulse { get; set; } = new();
}

public class OperationalPulseDto
{
    public string Time { get; set; } = string.Empty;
    public int Active { get; set; }
    public int Alerts { get; set; }
}
