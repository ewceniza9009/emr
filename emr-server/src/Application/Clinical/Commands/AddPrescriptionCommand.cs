using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Clinical.Commands;

public record AddPrescriptionCommand : IRequest<Guid>
{
    public Guid PatientId { get; init; }
    public string MedicationName { get; init; } = string.Empty;
    public string Strength { get; init; } = string.Empty;
    public string Dose { get; init; } = string.Empty;
    public string Frequency { get; init; } = string.Empty;
    public MedicationRoute Route { get; init; }
    public string? Indications { get; init; }
    public DateTimeOffset StartDate { get; init; } = DateTimeOffset.UtcNow;
}

public class AddPrescriptionCommandHandler : IRequestHandler<AddPrescriptionCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public AddPrescriptionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(AddPrescriptionCommand request, CancellationToken cancellationToken)
    {
        // 1. Find or Create Medication in Catalog
        var medication = await _context.Medications
            .FirstOrDefaultAsync(x => x.Name == request.MedicationName && x.Strength == request.Strength, cancellationToken);

        if (medication == null)
        {
            medication = new Medication
            {
                Name = request.MedicationName,
                Strength = request.Strength,
                DefaultRoute = request.Route
            };
            _context.Medications.Add(medication);
        }

        // 2. Create Prescription
        var prescription = new Prescription
        {
            PatientId = request.PatientId,
            MedicationId = medication.MedicationId,
            PrescribedById = Guid.Empty, // Should be from Current User context
            Dose = request.Dose,
            Frequency = request.Frequency,
            Route = request.Route,
            Indications = request.Indications,
            StartDate = request.StartDate,
            IsActive = true
        };

        _context.Prescriptions.Add(prescription);
        await _context.SaveChangesAsync(cancellationToken);

        return prescription.PrescriptionId;
    }
}
