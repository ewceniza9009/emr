using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.Extensions.Configuration;
using Nest;

namespace Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly IElasticClient _client;
    private const string PatientIndex = "halcyon-patients";
    private const string OutreachIndex = "halcyon-outreach";

    public SearchService(IConfiguration configuration)
    {
        var url = configuration["Elasticsearch:Url"] ?? "http://localhost:9200";
        var settings = new ConnectionSettings(new Uri(url))
            .DefaultIndex(PatientIndex);

        _client = new ElasticClient(settings);
    }

    public async Task<List<SearchResultDto>> GlobalSearchAsync(string term, CancellationToken cancellationToken)
    {
        var response = await _client.SearchAsync<ClinicalSearchDocument>(s => s
            .Index(Indices.Index(PatientIndex).And(OutreachIndex))
            .Query(q => q
                .MultiMatch(m => m
                    .Fields(f => f
                        .Field(d => d.Title, 2)
                        .Field(d => d.Subtitle)
                        .Field(d => d.Metadata)
                    )
                    .Query(term)
                    .Fuzziness(Fuzziness.Auto)
                )
            ), cancellationToken);

        if (!response.IsValid) 
        {
            throw new Exception($"Elasticsearch query failed: {response.ServerError?.Error?.Reason ?? "Cluster unreachable"}");
        }

        return response.Hits.Select(h => new SearchResultDto
        {
            Id = Guid.Parse(h.Id),
            Type = h.Index == PatientIndex ? "PATIENT" : "LEAD",
            Title = h.Source.Title,
            Subtitle = h.Source.Subtitle,
            Metadata = h.Source.Metadata
        }).ToList();
    }

    public async Task IndexPatientAsync(Patient patient, CancellationToken cancellationToken)
    {
        var primaryPhone = patient.Phones?.FirstOrDefault(p => p.IsPrimary)?.PhoneNumber ?? "No Phone";
        var primaryAddr = patient.Addresses?.FirstOrDefault(a => a.IsPrimary)?.Address;
        var location = primaryAddr != null ? $"{primaryAddr.City}, {primaryAddr.State}" : "No Address";
        
        var doc = new ClinicalSearchDocument
        {
            Title = $"{patient.FirstName} {patient.LastName}",
            Subtitle = patient.Mrn,
            Metadata = $"{patient.Dob:MM/dd/yyyy} | {primaryPhone} | {location}"
        };

        await _client.IndexAsync(doc, i => i.Index(PatientIndex).Id(patient.PatientId), cancellationToken);
    }

    public async Task IndexOutreachAsync(PatientOutreach outreach, CancellationToken cancellationToken)
    {
        var doc = new ClinicalSearchDocument
        {
            Title = $"{outreach.FirstName} {outreach.LastName}",
            Subtitle = outreach.Status.ToString(),
            Metadata = outreach.PrimaryPhone
        };

        await _client.IndexAsync(doc, i => i.Index(OutreachIndex).Id(outreach.PatientOutreachId), cancellationToken);
    }
}

/// <summary>
/// Professional Search Document for Clinical Registries
/// </summary>
public class ClinicalSearchDocument
{
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Metadata { get; set; } = string.Empty;
}
