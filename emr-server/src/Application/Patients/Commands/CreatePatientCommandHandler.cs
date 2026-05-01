using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;

namespace Application.Patients.Commands;

public class CreatePatientCommandHandler : IRequestHandler<CreatePatientCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreatePatientCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreatePatientCommand request, CancellationToken cancellationToken)
    {
        var patient = new Patient
        {
            PatientId = Guid.NewGuid(),
            Mrn = request.Mrn,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Dob = request.Dob,
            BiologicalSex = request.BiologicalSex,
            GenderIdentity = request.GenderIdentity,
            PhilhealthNumber = request.PhilhealthNumber,
            Address = request.Address,
            City = request.City,
            CreatedAt = DateTime.UtcNow
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync(cancellationToken);

        return patient.PatientId;
    }
}
