using Domain.Enums;

namespace Application.Navigation.Dtos;

public record CareNavigationCaseDto(
    Guid CaseId,
    Guid PatientId,
    Guid NavigatorId,
    AcuityLevel AcuityLevel,
    CaseStatus Status,
    DateTimeOffset OpenedAt
);
