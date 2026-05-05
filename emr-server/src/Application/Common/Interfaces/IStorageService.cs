namespace Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<Stream> DownloadFileAsync(string storageUrl, CancellationToken cancellationToken = default);
    Task DeleteFileAsync(string storageUrl, CancellationToken cancellationToken = default);
}
