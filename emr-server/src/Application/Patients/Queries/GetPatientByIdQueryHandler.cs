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
        var patient = await _context
            .Patients.Include(p => p.Addresses)
            .Include(p => p.Phones)
            .Include(p => p.Emails)
            .Include(p => p.Contacts)
            .Include(p => p.PatientDocuments)
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId, cancellationToken);

        if (patient is null)
            return null;

        return patient.Adapt<PatientDto>();
    }
}
