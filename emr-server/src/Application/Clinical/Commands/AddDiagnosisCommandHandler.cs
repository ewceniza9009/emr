using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Clinical.Commands;

public class AddDiagnosisCommandHandler : IRequestHandler<AddDiagnosisCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public AddDiagnosisCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(AddDiagnosisCommand request, CancellationToken cancellationToken)
    {
        var diagnosis = new Diagnosis
        {
            DiagnosisId = Guid.NewGuid(),
            PatientId = request.PatientId,
            Icd10Code = request.Icd10Code,
            Description = request.Description,
            IsPrimary = request.IsPrimary,
            DiagnosedAt = request.DiagnosedAt
        };

        _context.Diagnoses.Add(diagnosis);
        await _context.SaveChangesAsync(cancellationToken);

        return diagnosis.DiagnosisId;
    }
}
