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

        BlobClient blobClient;

        if (Uri.TryCreate(storageUrl, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
        {
            _logger.LogInformation("Azurite: Absolute URI detected.");
            blobClient = new BlobClient(uri);
        }
        else
        {
            // Handle relative paths by treating the filename as the blob name
            _logger.LogInformation("Azurite: Relative path detected. Attempting to resolve blob name.");
            var blobName = Path.GetFileName(storageUrl);
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            blobClient = containerClient.GetBlobClient(blobName);
        }

        try 
        {
            var response = await blobClient.DownloadStreamingAsync(cancellationToken: cancellationToken);
            return response.Value.Content;
        }
        catch (Azure.RequestFailedException ex) 
        {
            _logger.LogError(ex, "Azurite: Azure-specific failure downloading {Url}. Status: {Status}, ErrorCode: {ErrorCode}", storageUrl, ex.Status, ex.ErrorCode);
            if (ex.Status == 404)
            {
                throw new FileNotFoundException($"Document not found in storage: {storageUrl}", storageUrl);
            }
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Azurite: Critical non-Azure failure downloading {Url}. Message: {Message}", storageUrl, ex.Message);
            throw;
        }
    }

    public async Task DeleteFileAsync(string storageUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(storageUrl)) return;

        BlobClient blobClient;

        if (Uri.TryCreate(storageUrl, UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
        {
            // For absolute URIs, we use the service client's credentials but target the specific URI
            _logger.LogInformation("Azurite: Authorized delete for absolute URI: {Url}", storageUrl);
            var blobUriBuilder = new BlobUriBuilder(uri);
            var containerClient = _blobServiceClient.GetBlobContainerClient(blobUriBuilder.BlobContainerName);
            blobClient = containerClient.GetBlobClient(blobUriBuilder.BlobName);
        }
        else
        {
            // For relative paths, we assume the clinical-documents container
            _logger.LogInformation("Azurite: Authorized delete for relative path: {Url}", storageUrl);
            var containerClient = _blobServiceClient.GetBlobContainerClient("clinical-documents");
            var blobName = Path.GetFileName(storageUrl);
            blobClient = containerClient.GetBlobClient(blobName);
        }

        try 
        {
            await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: cancellationToken);
            _logger.LogInformation("Azurite: Successfully deleted blob at {Url}", storageUrl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Azurite: Non-critical failure during blob deletion for {Url}. It might have already been removed.", storageUrl);
        }
    }
}
