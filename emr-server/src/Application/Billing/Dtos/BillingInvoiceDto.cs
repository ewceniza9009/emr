using Domain.Enums;
using Application.Patients.Dtos;
using System.Collections.Generic;

namespace Application.Billing.Dtos;

public record BillingInvoiceDto(
    Guid InvoiceId,
    Guid PatientId,
    Guid? EncounterId,
    Guid? ClaimId,
    string InvoiceNumber,
    InvoiceStatus Status,
    decimal SubtotalAmount,
    decimal CoveredAmount,
    decimal PatientResponsibility,
    DateTimeOffset GeneratedAt,
    DateTimeOffset DueDate,
    PatientDto? Patient = null,
    ICollection<BillingInvoiceItemDto>? Items = null
);

public record BillingInvoiceItemDto(
    Guid ItemId,
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal TotalPrice
);
