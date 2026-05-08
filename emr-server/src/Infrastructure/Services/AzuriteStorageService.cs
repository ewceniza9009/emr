using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class AzuriteStorageService : IStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName;
    private readonly ILogger<AzuriteStorageService> _logger;

    public AzuriteStorageService(IConfiguration configuration, ILogger<AzuriteStorageService> logger)
    {
        _logger = logger;
        var connectionString = configuration.GetConnectionString("AzureStorage") ?? "UseDevelopmentStorage=true";
        _blobServiceClient = new BlobServiceClient(connectionString);
        _containerName = configuration["AzureStorage:ContainerName"] ?? "clinical-documents";
        
        // Ensure container exists
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        containerClient.CreateIfNotExists(PublicAccessType.Blob);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        var blobName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var blobClient = containerClient.GetBlobClient(blobName);

        var options = new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        };

        await blobClient.UploadAsync(fileStream, options, cancellationToken);
        
        _logger.LogInformation("Azurite: Uploaded {FileName} to {BlobName}", fileName, blobName);

        // For Azurite, the URL is usually http://127.0.0.1:10000/devstoreaccount1/clinical-documents/blobName
        return blobClient.Uri.ToString();
    }

    public async Task<Stream> DownloadFileAsync(string storageUrl, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Azurite: Attempting to download from {Url}", storageUrl);

        if (Uri.TryCreate(storageUrl, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
        {
            _logger.LogInformation("Azurite: URI detected, using BlobClient.");
            try 
            {
                var blobClient = new BlobClient(uri);
                var response = await blobClient.DownloadStreamingAsync(cancellationToken: cancellationToken);
                return response.Value.Content;
            }
            catch (Azure.RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogWarning("Azurite: Blob not found in container.");
                throw new FileNotFoundException("Blob not found in Azurite.", storageUrl);
            }
        }
        else
        {
            _logger.LogError("Azurite: Relative path or invalid URI detected. Storage provider requires absolute Azurite URI.");
            throw new FileNotFoundException("Document not found. Storage requires absolute Azurite URI.", storageUrl);
        }
    }

    public async Task DeleteFileAsync(string storageUrl, CancellationToken cancellationToken = default)
    {
        var blobClient = new BlobClient(new Uri(storageUrl));
        await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: cancellationToken);
        _logger.LogInformation("Azurite: Deleted blob at {Url}", storageUrl);
    }
}
