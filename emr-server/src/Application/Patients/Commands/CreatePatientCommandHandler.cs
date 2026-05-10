using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;

namespace Application.Patients.Commands;

public class CreatePatientCommandHandler : IRequestHandler<CreatePatientCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreatePatientCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(
        CreatePatientCommand request,
        CancellationToken cancellationToken
    )
    {
        var patient = new Patient
        {
            PatientId = Guid.NewGuid(),
            Mrn = request.Mrn,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Dob = request.Dob,
            BiologicalSex = Enum.Parse<BiologicalSex>(request.BiologicalSex, true),
            GenderIdentity = request.GenderIdentity,
            PhilhealthNumber = request.PhilhealthNumber,
            CivilStatus = request.CivilStatus,
            Religion = request.Religion,
            Occupation = request.Occupation,
            PlaceOfBirth = request.PlaceOfBirth,
            Nationality = request.Nationality,
            Language = request.Language,
            Addresses = new List<EntityAddress>
            {
                new EntityAddress
                {
                    Address = new Address
                    {
                        Street = request.Street,
                        City = request.City,
                        State = request.State,
                        PostalCode = request.PostalCode,
                        Latitude = request.Latitude.GetValueOrDefault(),
                        Longitude = request.Longitude.GetValueOrDefault(),
                    },
                    Type = Domain.Enums.AddressType.Home,
                    IsPrimary = true,
                },
            },
            CreatedAt = DateTime.UtcNow,
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync(cancellationToken);

        return patient.PatientId;
    }
}
