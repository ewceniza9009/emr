using Application.Appointments.Dtos;
using MediatR;

namespace Application.Appointments.Queries;

public record GetAppointmentsByPatientQuery(Guid PatientId) : IRequest<List<AppointmentDto>>;
