using Domain.Enums;

namespace Domain.Entities;

public enum MedicationRoute
{
    Oral,
    Subcutaneous,
    Intravenous,
    Transdermal,
    Rectal,
    Sublingual
}

public class Medication
{
    public Guid MedicationId { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty; // Generic + Brand
    public string Strength { get; set; } = string.Empty; // e.g., 5mg, 10mg/ml
    public MedicationRoute DefaultRoute { get; set; }
}

public class Prescription
{
    public Guid PrescriptionId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public Guid MedicationId { get; set; }
    public Guid PrescribedById { get; set; }
    
    public string Dose { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty; // e.g., Q4H
    public MedicationRoute Route { get; set; }
    public string? Indications { get; set; } // e.g., For breakthrough pain
    
    public DateTimeOffset StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    
    public Patient Patient { get; set; } = null!;
    public Medication Medication { get; set; } = null!;
    public Practitioner PrescribedBy { get; set; } = null!;
}
