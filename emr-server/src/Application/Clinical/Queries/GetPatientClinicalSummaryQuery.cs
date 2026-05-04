using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Clinical.Queries;

public record GetPatientClinicalSummaryQuery(Guid PatientId) : IRequest<PatientClinicalSummaryDto>;

public class GetPatientClinicalSummaryQueryHandler : IRequestHandler<GetPatientClinicalSummaryQuery, PatientClinicalSummaryDto>
{
    private readonly IApplicationDbContext _context;

    public GetPatientClinicalSummaryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PatientClinicalSummaryDto> Handle(GetPatientClinicalSummaryQuery request, CancellationToken cancellationToken)
    {
        var patient = await _context.Patients
            .Include(p => p.Addresses)
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId, cancellationToken);

        if (patient == null)
            throw new NotFoundException(nameof(Patient), request.PatientId);

        var meds = await _context.Prescriptions
            .Include(p => p.Medication)
            .Where(p => p.PatientId == request.PatientId && p.IsActive)
            .OrderByDescending(p => p.StartDate)
            .Select(p => new ActiveMedicationDto(
                p.Medication.Name,
                p.Dose,
                p.Frequency,
                p.Route.ToString(),
                p.Indications ?? "None"))
            .ToListAsync(cancellationToken);

        var vitals = await _context.VitalSigns
            .Where(v => v.Encounter.PatientId == request.PatientId)
            .OrderByDescending(v => v.RecordedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        var flattenedVitals = new List<RecentVitalDto>();
        foreach (var v in vitals)
        {
            if (v.BloodPressureSystolic.HasValue) flattenedVitals.Add(new RecentVitalDto("BP", $"{v.BloodPressureSystolic}/{v.BloodPressureDiastolic}", "mmHg", v.RecordedAt));
            if (v.HeartRate.HasValue) flattenedVitals.Add(new RecentVitalDto("HR", v.HeartRate.Value.ToString(), "bpm", v.RecordedAt));
            if (v.OxygenSaturation.HasValue) flattenedVitals.Add(new RecentVitalDto("SpO2", v.OxygenSaturation.Value.ToString(), "%", v.RecordedAt));
            if (v.Temperature.HasValue) flattenedVitals.Add(new RecentVitalDto("Temp", v.Temperature.Value.ToString(), "°F", v.RecordedAt));
            if (v.Weight.HasValue) flattenedVitals.Add(new RecentVitalDto("Weight", v.Weight.Value.ToString(), "kg", v.RecordedAt));
        }

        var problems = await _context.Diagnoses
            .Where(d => d.PatientId == request.PatientId)
            .OrderByDescending(d => d.DiagnosedAt)
            .Select(d => new ActiveProblemDto(d.Icd10Code, d.Description, d.DiagnosedAt))
            .ToListAsync(cancellationToken);

        var allergies = await _context.Allergies
            .Where(a => a.PatientId == request.PatientId)
            .Select(a => new AllergyDto(a.Allergen, a.Reaction, a.Severity.ToString()))
            .ToListAsync(cancellationToken);

        return new PatientClinicalSummaryDto
        {
            PatientId = patient.PatientId,
            FullName = $"{patient.FirstName} {patient.LastName}",
            Mrn = patient.Mrn,
            Age = DateTime.UtcNow.Year - patient.Dob.Year, // Simplified age calc
            Gender = patient.BiologicalSex,
            ActiveMedications = meds,
            RecentVitals = flattenedVitals,
            ActiveProblems = problems,
            Allergies = allergies
        };
    }
}
