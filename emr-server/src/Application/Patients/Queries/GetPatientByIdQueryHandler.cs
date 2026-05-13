using Application.Common.Interfaces;
using Application.Patients.Dtos;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Queries;

public class GetPatientByIdQueryHandler : IRequestHandler<GetPatientByIdQuery, PatientDto?>
{
    private readonly IApplicationDbContext _context;

    public GetPatientByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PatientDto?> Handle(
        GetPatientByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        return await _context
            .Patients.AsNoTracking()
            .Where(p => p.PatientId == request.PatientId)
            .ProjectToType<PatientDto>()
            .FirstOrDefaultAsync(cancellationToken);
    }
}
