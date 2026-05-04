using Application.Common.Interfaces;
using Application.Patients.Dtos;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Patients.Queries;

public class GetPatientsQueryHandler : IRequestHandler<GetPatientsQuery, IEnumerable<PatientDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPatientsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PatientDto>> Handle(
        GetPatientsQuery request,
        CancellationToken cancellationToken
    )
    {
        var patients = await _context
            .Patients.Include(p => p.Addresses)
            .Include(p => p.Phones)
            .Include(p => p.Emails)
            .ToListAsync(cancellationToken);

        return patients.Adapt<List<PatientDto>>();
    }
}
