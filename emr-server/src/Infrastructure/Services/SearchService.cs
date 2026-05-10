using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Nest;

namespace Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly IElasticClient _client;
    private readonly ICurrentUserService _currentUserService;
    private readonly IServiceProvider _serviceProvider;
    private const string PatientIndex = "halcyon-patients";
    private const string OutreachIndex = "halcyon-outreach";

    public SearchService(IConfiguration configuration, ICurrentUserService currentUserService, IServiceProvider serviceProvider)
    {
        _currentUserService = currentUserService;
        _serviceProvider = serviceProvider;
        var url = configuration["Elasticsearch:Url"] ?? "http://localhost:9200";
        var settings = new ConnectionSettings(new Uri(url))
            .DefaultIndex(PatientIndex);

        _client = new ElasticClient(settings);
    }

    public async Task<List<SearchResultDto>> GlobalSearchAsync(string term, CancellationToken cancellationToken)
    {
        List<SearchResultDto> results = new();

        try 
        {
            var response = await _client.SearchAsync<ClinicalSearchDocument>(s => s
                .Index(Indices.Index(PatientIndex).And(OutreachIndex))
                .Query(q => q
                    .Bool(b => b
                        .Must(mu => mu
                            .MultiMatch(m => m
                                .Fields(f => f
                                    .Field(d => d.Title, 2)
                                    .Field(d => d.Subtitle)
                                    .Field(d => d.Metadata)
                                )
                                .Query(term)
                                .Fuzziness(Fuzziness.Auto)
                            )
                        )
                        .Filter(fi => fi
                            .Term(t => t
                                .Field(f => f.TenantId)
                                .Value(_currentUserService.TenantId ?? Guid.Empty)
                            )
                        )
                    )
                ), cancellationToken);

            if (response.IsValid && response.Hits.Any())
            {
                results = response.Hits.Select(h => new SearchResultDto
                {
                    Id = Guid.Parse(h.Id),
                    Type = h.Index == PatientIndex ? "PATIENT" : "LEAD",
                    Title = h.Source.Title,
                    Subtitle = h.Source.Subtitle,
                    Metadata = h.Source.Metadata
                }).ToList();

                return results;
            }
        }
        catch (Exception ex)
        {
            // Fallback to database on Elasticsearch failure
            Console.WriteLine($"Elasticsearch search failed, falling back to DB: {ex.Message}");
        }

        // DATABASE FALLBACK: Mission-Critical Fail-over
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        
        var searchTerm = term.ToLower();
        var tenantId = _currentUserService.TenantId ?? Guid.Empty;

        // Search Patients
        var dbPatients = await context.Patients
            .Include(p => p.Phones)
            .Include(p => p.Addresses).ThenInclude(a => a.Address)
            .Where(p => p.TenantId == tenantId && 
                       (p.FirstName.ToLower().Contains(searchTerm) || 
                        p.LastName.ToLower().Contains(searchTerm) || 
                        p.Mrn.ToLower().Contains(searchTerm)))
            .Take(10)
            .ToListAsync(cancellationToken);

        results.AddRange(dbPatients.Select(p => new SearchResultDto
        {
            Id = p.PatientId,
            Type = "PATIENT",
            Title = $"{p.FirstName} {p.LastName}",
            Subtitle = p.Mrn,
            Metadata = $"{p.Dob:MM/dd/yyyy} | {p.Phones?.FirstOrDefault(ph => ph.IsPrimary)?.PhoneNumber ?? "No Phone"}"
        }));

        // Search Outreach (if space permits)
        if (results.Count < 10)
        {
            var dbOutreach = await context.PatientOutreaches
                .Where(o => o.TenantId == tenantId && 
                           (o.FirstName.ToLower().Contains(searchTerm) || 
                            o.LastName.ToLower().Contains(searchTerm) || 
                            o.PrimaryPhone.Contains(searchTerm)))
                .Take(10 - results.Count)
                .ToListAsync(cancellationToken);

            results.AddRange(dbOutreach.Select(o => new SearchResultDto
            {
                Id = o.PatientOutreachId,
                Type = "LEAD",
                Title = $"{o.FirstName} {o.LastName}",
                Subtitle = o.Status.ToString(),
                Metadata = o.PrimaryPhone
            }));
        }

        return results;
    }

    public async Task IndexPatientAsync(Patient patient, CancellationToken cancellationToken)
    {
        var primaryPhone = patient.Phones?.FirstOrDefault(p => p.IsPrimary)?.PhoneNumber ?? "No Phone";
        var primaryAddr = patient.Addresses?.FirstOrDefault(a => a.IsPrimary)?.Address;
        var location = primaryAddr != null ? $"{primaryAddr.City}, {primaryAddr.State}" : "No Address";
        
        var doc = new ClinicalSearchDocument
        {
            TenantId = patient.TenantId,
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
            TenantId = outreach.TenantId,
            Title = $"{outreach.FirstName} {outreach.LastName}",
            Subtitle = outreach.Status.ToString(),
            Metadata = outreach.PrimaryPhone
        };

        await _client.IndexAsync(doc, i => i.Index(OutreachIndex).Id(outreach.PatientOutreachId), cancellationToken);
    }

    public async Task RecreateIndicesAsync(CancellationToken cancellationToken)
    {
        await _client.Indices.DeleteAsync(PatientIndex, ct: cancellationToken);
        await _client.Indices.DeleteAsync(OutreachIndex, ct: cancellationToken);

        await _client.Indices.CreateAsync(PatientIndex, c => c
            .Map<ClinicalSearchDocument>(m => m
                .AutoMap()
                .Properties(p => p
                    .Keyword(k => k.Name(n => n.TenantId))
                )
            ), cancellationToken);

        await _client.Indices.CreateAsync(OutreachIndex, c => c
            .Map<ClinicalSearchDocument>(m => m
                .AutoMap()
                .Properties(p => p
                    .Keyword(k => k.Name(n => n.TenantId))
                )
            ), cancellationToken);
    }
}

/// <summary>
/// Professional Search Document for Clinical Registries
/// </summary>
public class ClinicalSearchDocument
{
    public Guid TenantId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Metadata { get; set; } = string.Empty;
}
