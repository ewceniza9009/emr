using MediatR;

namespace Application.Clinical.Commands;

public record AddDiagnosisCommand(
    Guid PatientId,
    string Icd10Code,
    string Description,
    bool IsPrimary,
    DateTime DiagnosedAt
) : IRequest<Guid>;
