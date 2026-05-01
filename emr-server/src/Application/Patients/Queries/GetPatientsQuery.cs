using Application.Patients.Dtos;
using MediatR;

namespace Application.Patients.Queries;

public record GetPatientsQuery : IRequest<IEnumerable<PatientDto>>;
