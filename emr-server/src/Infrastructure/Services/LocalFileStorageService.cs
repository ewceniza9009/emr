using Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class LocalFileStorageService : IStorageService
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<LocalFileStorageService> _logger;
    private readonly string _uploadsFolder = "uploads";

    public LocalFileStorageService(IWebHostEnvironment environment, ILogger<LocalFileStorageService> logger)
    {
        _environment = environment;
        _logger = logger;
        
        // Ensure the uploads folder exists in wwwroot
        var path = Path.Combine(_environment.WebRootPath ?? "wwwroot", _uploadsFolder);
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(fileName)}";
        var path = Path.Combine(_environment.WebRootPath ?? "wwwroot", _uploadsFolder, uniqueName);

        using (var fs = new FileStream(path, FileMode.Create))
        {
            await fileStream.CopyToAsync(fs, cancellationToken);
        }

        _logger.LogInformation("Local Storage: Saved file to {Path}", path);

        // Return a relative URL that the frontend can use
        return $"/{_uploadsFolder}/{uniqueName}";
    }

    public async Task<Stream> DownloadFileAsync(string storageUrl, CancellationToken cancellationToken = default)
    {
        // storageUrl is expected to be something like "/uploads/guid.ext"
        var relativePath = storageUrl.TrimStart('/');
        var path = Path.Combine(_environment.WebRootPath ?? "wwwroot", relativePath);

        if (!File.Exists(path))
        {
            _logger.LogError("Local Storage: File not found at {Path}", path);
            throw new FileNotFoundException("File not found locally", path);
        }

        var memory = new MemoryStream();
        using (var fs = new FileStream(path, FileMode.Open))
        {
            await fs.CopyToAsync(memory, cancellationToken);
        }
        memory.Position = 0;
        return memory;
    }

    public async Task DeleteFileAsync(string storageUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(storageUrl)) return;

        var relativePath = storageUrl.TrimStart('/');
        var path = Path.Combine(_environment.WebRootPath ?? "wwwroot", relativePath);

        if (File.Exists(path))
        {
            File.Delete(path);
            _logger.LogInformation("Local Storage: Deleted file at {Path}", path);
        }
    }
}
