using Application.Common.Exceptions;
using Application.Common.Interfaces;
using Domain.Entities;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Clinical.Queries;

public record GetPatientClinicalSummaryQuery(Guid PatientId) : IRequest<PatientClinicalSummaryDto>;

public class GetPatientClinicalSummaryQueryHandler
    : IRequestHandler<GetPatientClinicalSummaryQuery, PatientClinicalSummaryDto>
{
    private readonly IApplicationDbContext _context;

    public GetPatientClinicalSummaryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PatientClinicalSummaryDto> Handle(
        GetPatientClinicalSummaryQuery request,
        CancellationToken cancellationToken
    )
    {
        var patient = await _context
            .Patients.AsNoTracking()
            .FirstOrDefaultAsync(p => p.PatientId == request.PatientId, cancellationToken);

        if (patient == null)
            throw new NotFoundException(nameof(Patient), request.PatientId);

        var meds = await _context
            .Prescriptions.Include(p => p.Medication)
            .Where(p => p.PatientId == request.PatientId && p.IsActive)
            .OrderByDescending(p => p.StartDate)
            .Select(p => new ActiveMedicationDto(
                p.Medication!.Name,
                p.Dose,
                p.Frequency,
                p.Route.ToString(),
                p.Indications ?? "None"
            ))
            .ToListAsync(cancellationToken);

        var vitals = await _context
            .VitalSigns.AsNoTracking()
            .Where(v => v.Encounter.PatientId == request.PatientId)
            .OrderByDescending(v => v.RecordedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        var flattenedVitals = new List<RecentVitalDto>();
        var seenTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var v in vitals)
        {
            if (v.BloodPressureSystolic.HasValue && seenTypes.Add("BP"))
            {
                var sys = Math.Round(v.BloodPressureSystolic.Value, 0).ToString("0");
                var dia = v.BloodPressureDiastolic.HasValue
                    ? Math.Round(v.BloodPressureDiastolic.Value, 0).ToString("0")
                    : "--";
                flattenedVitals.Add(new RecentVitalDto("BP", $"{sys}/{dia}", "mmHg", v.RecordedAt));
            }
            if (v.HeartRate.HasValue && seenTypes.Add("HR"))
            {
                flattenedVitals.Add(
                    new RecentVitalDto("HR", Math.Round(v.HeartRate.Value, 0).ToString("0"), "bpm", v.RecordedAt)
                );
            }
            if (v.OxygenSaturation.HasValue && seenTypes.Add("SpO2"))
            {
                flattenedVitals.Add(
                    new RecentVitalDto(
                        "SpO2",
                        Math.Round(v.OxygenSaturation.Value, 0).ToString("0"),
                        "%",
                        v.RecordedAt
                    )
                );
            }
            if (v.Temperature.HasValue && seenTypes.Add("Temp"))
            {
                flattenedVitals.Add(
                    new RecentVitalDto("Temp", v.Temperature.Value.ToString("0.#"), "°F", v.RecordedAt)
                );
            }
            if (v.Weight.HasValue && seenTypes.Add("Weight"))
            {
                flattenedVitals.Add(
                    new RecentVitalDto("Weight", v.Weight.Value.ToString("0.#"), "kg", v.RecordedAt)
                );
            }
        }

        var problems = await _context
            .Diagnoses.AsNoTracking()
            .Where(d => d.PatientId == request.PatientId)
            .OrderByDescending(d => d.DiagnosedAt)
            .Select(d => new ActiveProblemDto(d.Icd10Code, d.Description, d.DiagnosedAt))
            .ToListAsync(cancellationToken);

        var allergies = await _context
            .Allergies.AsNoTracking()
            .Where(a => a.PatientId == request.PatientId)
            .Select(a => new AllergyDto(a.Allergen, a.Reaction, a.Severity.ToString()))
            .ToListAsync(cancellationToken);

        return new PatientClinicalSummaryDto
        {
            PatientId = patient.PatientId,
            FullName = $"{patient.FirstName} {patient.LastName}",
            Mrn = patient.Mrn,
            Age = DateTime.UtcNow.Year - patient.Dob.Year,
            Gender = patient.BiologicalSex.ToString(),
            ActiveMedications = meds,
            RecentVitals = flattenedVitals,
            ActiveProblems = problems,
            Allergies = allergies,
        };
    }
}
