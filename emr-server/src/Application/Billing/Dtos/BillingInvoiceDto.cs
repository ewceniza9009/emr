using Domain.Enums;

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
    DateTimeOffset DueDate
);
