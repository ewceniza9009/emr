using Application.Clinical.Dtos;
using Application.Common.Models;
using MediatR;

namespace Application.Clinical.Queries;

public record GetTriageWorklistQuery(
    string? Search = null, 
    int Skip = 0, 
    int Take = 50,
    bool? IsAlert = null,
    List<string>? DirectiveTypes = null
) : IRequest<PagedResponse<TriageItemDto>>;
