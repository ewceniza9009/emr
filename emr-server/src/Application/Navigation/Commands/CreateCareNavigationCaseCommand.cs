using Domain.Enums;
using MediatR;

namespace Application.Navigation.Commands;

public record CreateCareNavigationCaseCommand(
    Guid PatientId,
    Guid NavigatorId,
    AcuityLevel AcuityLevel
) : IRequest<Guid>;
