using Domain.Entities;

namespace Application.Common.Interfaces;

public interface ISearchService
{
    Task<List<SearchResultDto>> GlobalSearchAsync(string term, CancellationToken cancellationToken);
    Task IndexPatientAsync(Patient patient, CancellationToken cancellationToken);
    Task IndexOutreachAsync(PatientOutreach outreach, CancellationToken cancellationToken);
    Task RecreateIndicesAsync(CancellationToken cancellationToken);
}

public class SearchResultDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string Metadata { get; set; } = string.Empty;
}
