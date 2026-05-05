using Application.Common.Models;
using Domain.Entities;
using MediatR;

namespace Application.Outreach.Queries;

public record GetOutreachesQuery(string? Search = null, int Skip = 0, int Take = 50)
    : IRequest<PagedResponse<PatientOutreach>>;
