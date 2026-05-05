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
            .Include(p => p.Appointments)
            .Include(p => p.Contacts)
            .ToListAsync(cancellationToken);

        var dtos = patients.Adapt<List<PatientDto>>();
        
        foreach (var dto in dtos)
        {
            var patient = patients.First(p => p.PatientId == dto.PatientId);
            var latestAppt = patient.Appointments
                .OrderByDescending(a => a.ScheduledStart)
                .FirstOrDefault();
            
            dto.VisitStatus = latestAppt?.Status.ToString() ?? "No Visit";
        }

        return dtos;
    }
}
