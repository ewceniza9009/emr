using System.Text.Json;
using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Integrations.Elation;

public class ElationClient : IElationClient
{
    private readonly HttpClient _httpClient;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ElationClient> _logger;

    private readonly IConfiguration _configuration;

    public ElationClient(
        HttpClient httpClient,
        IApplicationDbContext context,
        ILogger<ElationClient> logger,
        IConfiguration configuration
    )
    {
        _httpClient = httpClient;
        _context = context;
        _logger = logger;
        _configuration = configuration;

        var apiKey = _configuration["Integrations:Elation:ApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        }
    }

    public async Task<bool> PushSoapNoteAsync(
        Guid encounterId,
        CancellationToken cancellationToken = default
    )
    {
        var encounter = await _context
            .ClinicalEncounters.Include(x => x.Patient)
            .Include(x => x.ClinicalNotes)
            .FirstOrDefaultAsync(x => x.EncounterId == encounterId, cancellationToken);

        if (encounter == null)
            return false;

        _logger.LogInformation(
            "Pushing SOAP Note to Elation for Patient {PatientName} (MRN: {Mrn})",
            $"{encounter.Patient.FirstName} {encounter.Patient.LastName}",
            encounter.Patient.Mrn
        );

        // Simulation of Elation API Payload
        var payload = new
        {
            patient_id = encounter.Patient.ExternalId ?? "EL-EXT-001",
            note_type = "Palliative SOAP",
            content = string.Join(
                "\n",
                encounter.ClinicalNotes.Select(n => $"{n.Type}: {n.Content}")
            ),
        };

        _logger.LogDebug("Elation Payload: {Payload}", JsonSerializer.Serialize(payload));

        // Actual implementation would be:
        // var response = await _httpClient.PostAsJsonAsync("/notes", payload, cancellationToken);
        // return response.IsSuccessStatusCode;

        return true; // Mock success for now
    }

    public async Task<bool> SyncPatientDemographicsAsync(
        Guid patientId,
        CancellationToken cancellationToken = default
    )
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(
            x => x.PatientId == patientId,
            cancellationToken
        );
        if (patient == null)
            return false;

        _logger.LogInformation(
            "Syncing Demographics from Elation for Patient ID: {PatientId}",
            patientId
        );

        // Actual implementation would pull from Elation and update local patient record
        // patient.FirstName = elationData.FirstName;
        // await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
