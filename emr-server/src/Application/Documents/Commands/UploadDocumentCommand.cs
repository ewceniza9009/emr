using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Documents.Commands;

public record UploadDocumentCommand(
    Guid PatientId,
    Guid? PatientContactId,
    string Title,
    string DocumentType,
    IFile File
) : IRequest<Guid>;

public class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, Guid>
{
    private readonly IApplicationDbContext _context;
    private readonly IStorageService _storageService;

    public UploadDocumentCommandHandler(IApplicationDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task<Guid> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        var storageUrl = await _storageService.UploadFileAsync(
            request.File.OpenReadStream(),
            request.File.Name,
            request.File.ContentType,
            cancellationToken
        );

        var document = new PatientDocument
        {
            PatientId = request.PatientId,
            PatientContactId = request.PatientContactId,
            Title = request.Title,
            DocumentType = request.DocumentType,
            StorageUrl = storageUrl,
            ContentType = request.File.ContentType,
            FileSize = request.File.Length ?? 0,
            UploadedAt = DateTimeOffset.UtcNow
        };

        _context.PatientDocuments.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        return document.PatientDocumentId;
    }
}
