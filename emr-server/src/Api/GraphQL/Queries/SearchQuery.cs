using Application.Common.Interfaces;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Types;
using Microsoft.EntityFrameworkCore;

namespace Api.GraphQL.Queries;

[ExtendObjectType("Query")]
public class SearchQuery
{
    public async Task<List<SearchResult>> GlobalSearch(
        string term,
        [Service] IApplicationDbContext context,
        [Service] ISearchService searchService,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(term))
            return new List<SearchResult>();

        try
        {
            var config = await context.TenantConfigurations.FirstOrDefaultAsync(cancellationToken);
            bool useElastic = config?.EnableElasticsearch ?? false;

            if (useElastic)
            {
                try
                {
                    var results = await searchService.GlobalSearchAsync(term, cancellationToken);
                    if (results.Any())
                    {
                        return results
                            .Select(r => new SearchResult
                            {
                                Id = r.Id,
                                Type = r.Type,
                                Title = r.Title,
                                Subtitle = r.Subtitle,
                                Metadata = r.Metadata,
                            })
                            .ToList();
                    }

                    // CASCADE: If Elastic is empty, try SQL before giving up
                    return await PerformSqlSearch(term, context, cancellationToken);
                }
                catch
                {
                    // FAIL-SAFE: Revert to SQL if Elastic cluster is unreachable
                    return await PerformSqlSearch(term, context, cancellationToken);
                }
            }

            return await PerformSqlSearch(term, context, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            // Graceful exit for debounced requests
            return new List<SearchResult>();
        }
        catch (Exception)
        {
            return new List<SearchResult>();
        }
    }

    private async Task<List<SearchResult>> PerformSqlSearch(
        string term,
        IApplicationDbContext context,
        CancellationToken cancellationToken
    )
    {
        var lowerTerm = term.ToLower();

        var patients = await context
            .Patients.Include(p => p.Phones)
            .Include(p => p.Addresses)
                .ThenInclude(a => a.Address)
            .Where(p =>
                p.FirstName.ToLower().Contains(lowerTerm)
                || p.LastName.ToLower().Contains(lowerTerm)
                || p.Mrn.ToLower().Contains(lowerTerm)
                || p.Phones.Any(ph => ph.PhoneNumber.Contains(term))
            )
            .Take(10)
            .ToListAsync(cancellationToken);

        var patientResults = patients
            .Select(p => new SearchResult
            {
                Id = p.PatientId,
                Type = "PATIENT",
                Title = $"{p.FirstName} {p.LastName}",
                Subtitle = p.Mrn,
                Metadata =
                    $"{p.Dob:MM/dd/yyyy} | "
                    + (
                        p.Phones.FirstOrDefault(ph => ph.IsPrimary)?.PhoneNumber
                        ?? p.Phones.FirstOrDefault()?.PhoneNumber
                        ?? "N/A"
                    )
                    + " | "
                    + (
                        p.Addresses.FirstOrDefault(a => a.IsPrimary)?.Address?.City
                        ?? p.Addresses.FirstOrDefault()?.Address?.City
                        ?? "N/A"
                    ),
            })
            .ToList();

        var outreaches = await context
            .PatientOutreaches.Where(o =>
                o.FirstName.ToLower().Contains(lowerTerm)
                || o.LastName.ToLower().Contains(lowerTerm)
            )
            .Take(10)
            .ToListAsync(cancellationToken);

        var outreachResults = outreaches
            .Select(o => new SearchResult
            {
                Id = o.PatientOutreachId,
                Type = "LEAD",
                Title = $"{o.FirstName} {o.LastName}",
                Subtitle = o.Status.ToString(),
                Metadata = o.PrimaryPhone,
            })
            .ToList();

        return patientResults.Concat(outreachResults).ToList();
    }
}

public class SearchResult
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Metadata { get; set; } = string.Empty;
}
