namespace Application.Billing.Dtos;

public class BillingSummaryDto
{
    public decimal TotalReceivables { get; set; }
    public int PendingClaimsCount { get; set; }
    public int TotalClaimsCount { get; set; }
    public decimal PaidClaimsTotal { get; set; }
}
