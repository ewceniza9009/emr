using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Application.Clinical.Services;

public interface IConflictEngine
{
    Task<List<string>> CheckConflictsAsync(Guid patientId, string newMedicationName, CancellationToken cancellationToken = default);
}

public class ConflictEngine : IConflictEngine
{
    private readonly IApplicationDbContext _context;

    public ConflictEngine(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> CheckConflictsAsync(Guid patientId, string newMedicationName, CancellationToken cancellationToken = default)
    {
        var conflicts = new List<string>();

        // Fetch active prescriptions
        var activeMeds = await _context.Prescriptions
            .Include(x => x.Medication)
            .Where(x => x.PatientId == patientId && x.IsActive)
            .Select(x => x.Medication.Name.ToLower())
            .ToListAsync(cancellationToken);

        var newMed = newMedicationName.ToLower();

        // 1. Duplicate Opioid Check
        if ((newMed.Contains("morphine") || newMed.Contains("fentanyl") || newMed.Contains("oxycodone")) &&
            activeMeds.Any(m => m.Contains("morphine") || m.Contains("fentanyl") || m.Contains("oxycodone")))
        {
            conflicts.Add("Therapeutic Duplication: Patient is already on an opioid regimen. Monitor for respiratory depression.");
        }

        // 2. Benzodiazepine + Opioid Check
        if ((newMed.Contains("lorazepam") || newMed.Contains("ativan") || newMed.Contains("diazepam")) &&
            activeMeds.Any(m => m.Contains("morphine") || m.Contains("fentanyl")))
        {
            conflicts.Add("High-Risk Combination: Concomitant use of Benzodiazepines and Opioids increases risk of fatal sedation.");
        }

        return conflicts;
    }
}
