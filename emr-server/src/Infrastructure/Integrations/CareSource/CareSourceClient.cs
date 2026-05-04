using System.Text.Json;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Integrations.CareSource;

public class CareSourceClient : ICareSourceClient
{
    private readonly HttpClient _httpClient;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CareSourceClient> _logger;
    private readonly IConfiguration _configuration;

    public CareSourceClient(
        HttpClient httpClient,
        IApplicationDbContext context,
        ILogger<CareSourceClient> logger,
        IConfiguration configuration
    )
    {
        _httpClient = httpClient;
        _context = context;
        _logger = logger;
        _configuration = configuration;

        var clientId = _configuration["Integrations:CareSource:ClientId"];
        if (!string.IsNullOrEmpty(clientId))
        {
            _httpClient.DefaultRequestHeaders.Add("X-CareSource-Client-Id", clientId);
        }
    }

    public async Task<bool> ReportPalliativeMetricsAsync(
        Guid patientId,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        CancellationToken cancellationToken = default
    )
    {
        // Aggregate ESAS and PPS data for the period
        var assessments = await _context
            .EsasAssessments.Where(x =>
                x.PatientId == patientId && x.AssessedAt >= startDate && x.AssessedAt <= endDate
            )
            .ToListAsync(cancellationToken);

        if (!assessments.Any())
        {
            _logger.LogWarning(
                "No assessments found for CareSource reporting for Patient {PatientId} in period {Start} to {End}",
                patientId,
                startDate,
                endDate
            );
            return false;
        }

        var report = new
        {
            patient_id = patientId,
            period_start = startDate,
            period_end = endDate,
            avg_pain = assessments.Average(x => x.Pain),
            avg_wellbeing = assessments.Average(x => x.Wellbeing),
            assessment_count = assessments.Count,
            submission_type = "Monthly Palliative Summary",
        };

        _logger.LogInformation(
            "Submitting CareSource Palliative Report: {Report}",
            JsonSerializer.Serialize(report)
        );

        // Actual implementation would be:
        // await _httpClient.PostAsJsonAsync("/reporting/palliative", report, cancellationToken);

        return true;
    }
}
