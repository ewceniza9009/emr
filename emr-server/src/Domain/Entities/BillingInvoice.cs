using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class BillingInvoice : BaseEntity
{
    public Guid InvoiceId { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public Guid? ClaimId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public decimal SubtotalAmount { get; set; }
    public decimal CoveredAmount { get; set; }
    public decimal PatientResponsibility { get; set; }
    public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset DueDate { get; set; }

    public Patient Patient { get; set; } = null!;
    public ClinicalEncounter? Encounter { get; set; }
    public ZBenefitClaim? Claim { get; set; }
}
