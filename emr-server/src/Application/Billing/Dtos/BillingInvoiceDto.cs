using Domain.Enums;
using Application.Patients.Dtos;
using System.Collections.Generic;

namespace Application.Billing.Dtos;

public class BillingInvoiceDto
{
    public Guid InvoiceId { get; set; }
    public Guid PatientId { get; set; }
    public Guid? EncounterId { get; set; }
    public Guid? ClaimId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public InvoiceStatus Status { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal CoveredAmount { get; set; }
    public decimal PatientResponsibility { get; set; }
    public DateTimeOffset GeneratedAt { get; set; }
    public DateTimeOffset DueDate { get; set; }
    public PatientDto? Patient { get; set; }
    public ICollection<BillingInvoiceItemDto>? Items { get; set; }
}

public class BillingInvoiceItemDto
{
    public Guid ItemId { get; set; }
    public Guid InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
}
