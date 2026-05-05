using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Documents.Commands;

public record UploadDocumentCommand(
    Guid PatientId,
    Guid? PatientContactId,
    string Title,
    string DocumentType,
    Stream FileStream,
    string FileName,
    string ContentType,
    long FileSize
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
            request.FileStream,
            request.FileName,
            request.ContentType,
            cancellationToken
        );

        var document = new PatientDocument
        {
            PatientId = request.PatientId,
            PatientContactId = request.PatientContactId,
            Title = request.Title,
            DocumentType = request.DocumentType,
            StorageUrl = storageUrl,
            ContentType = request.ContentType,
            FileSize = request.FileSize,
            UploadedAt = DateTimeOffset.UtcNow
        };

        _context.PatientDocuments.Add(document);
        await _context.SaveChangesAsync(cancellationToken);

        return document.PatientDocumentId;
    }
}
