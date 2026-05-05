using Application.Documents.Commands;
using MediatR;
using HotChocolate.Types;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class DocumentMutation
{
    public async Task<Guid> UploadDocument(
        Guid patientId,
        Guid? patientContactId,
        string title,
        string documentType,
        IFile file,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(new UploadDocumentCommand(
            patientId,
            patientContactId,
            title,
            documentType,
            file.OpenReadStream(),
            file.Name,
            file.ContentType,
            file.Length ?? 0
        ), cancellationToken);
    }
}
