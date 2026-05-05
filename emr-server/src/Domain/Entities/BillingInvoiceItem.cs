using Domain.Common;

namespace Domain.Entities;

public class BillingInvoiceItem : BaseEntity
{
    public Guid ItemId { get; set; } = Guid.NewGuid();
    public Guid InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }

    public BillingInvoice Invoice { get; set; } = null!;
}
