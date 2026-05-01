using Application.Patients.Dtos;
using MediatR;

namespace Application.Patients.Queries;

public record GetPatientByIdQuery(Guid PatientId) : IRequest<PatientDto?>;
