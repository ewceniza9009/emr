using Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

/// <summary>
/// Asterite Centralized Document Handling Service.
/// Implements a high-performance, unified storage abstraction for clinical documents, 
/// patient IDs, and legal authorizations (POA).
/// </summary>
public class AsteriteStorageService : IStorageService
{
    private readonly ILogger<AsteriteStorageService> _logger;
    private readonly string _storagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "documents");

    public AsteriteStorageService(ILogger<AsteriteStorageService> logger)
    {
        _logger = logger;
        if (!Directory.Exists(_storagePath))
        {
            Directory.CreateDirectory(_storagePath);
        }
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var fileId = Guid.NewGuid().ToString();
        var extension = Path.GetExtension(fileName);
        var storedFileName = $"{fileId}{extension}";
        var fullPath = Path.Combine(_storagePath, storedFileName);

        using var outputStream = new FileStream(fullPath, FileMode.Create);
        await fileStream.CopyToAsync(outputStream, cancellationToken);

        _logger.LogInformation("Asterite: Document {FileName} successfully ingested and stored at {Path}", fileName, fullPath);

        return $"/documents/{storedFileName}";
    }

    public async Task<Stream> DownloadFileAsync(string storageUrl, CancellationToken cancellationToken = default)
    {
        var fileName = Path.GetFileName(storageUrl);
        var fullPath = Path.Combine(_storagePath, fileName);

        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException("Document not found in Asterite vault.", fullPath);
        }

        return new FileStream(fullPath, FileMode.Open, FileAccess.Read);
    }

    public Task DeleteFileAsync(string storageUrl, CancellationToken cancellationToken = default)
    {
        var fileName = Path.GetFileName(storageUrl);
        var fullPath = Path.Combine(_storagePath, fileName);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            _logger.LogInformation("Asterite: Document {Url} purged from vault.", storageUrl);
        }

        return Task.CompletedTask;
    }
}
