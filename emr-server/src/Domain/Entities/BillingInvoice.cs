using Domain.Common;
using Domain.Enums;
using System.Collections.Generic;

namespace Domain.Entities;

public class BillingInvoice : BaseEntity, ITenantEntity
{
    public Guid InvoiceId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
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
    public ICollection<BillingInvoiceItem> Items { get; set; } = new List<BillingInvoiceItem>();
}
