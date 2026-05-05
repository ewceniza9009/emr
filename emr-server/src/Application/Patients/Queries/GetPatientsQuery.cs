using Application.Common.Models;
using Application.Patients.Dtos;
using MediatR;

namespace Application.Patients.Queries;

public record GetPatientsQuery(string? Search = null, int Skip = 0, int Take = 50)
    : IRequest<PagedResponse<PatientDto>>;
