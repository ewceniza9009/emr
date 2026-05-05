using Application.Documents.Commands;
using MediatR;

namespace Api.GraphQL.Mutations;

[ExtendObjectType("Mutation")]
public class DocumentMutation
{
    public async Task<Guid> UploadDocument(
        UploadDocumentCommand input,
        [Service] IMediator mediator,
        CancellationToken cancellationToken
    )
    {
        return await mediator.Send(input, cancellationToken);
    }
}
