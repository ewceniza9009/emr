using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BillingInvoiceItemConfiguration : IEntityTypeConfiguration<BillingInvoiceItem>
{
    public void Configure(EntityTypeBuilder<BillingInvoiceItem> builder)
    {
        builder.ToTable("billing_invoice_items");

        builder.HasKey(i => i.ItemId);

        builder.Property(i => i.ItemId).HasColumnName("item_id");
        builder.Property(i => i.InvoiceId).HasColumnName("invoice_id").IsRequired();
        
        builder.Property(i => i.Description)
            .HasColumnName("description")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(i => i.Quantity)
            .HasColumnName("quantity")
            .HasColumnType("numeric(12,2)")
            .IsRequired();

        builder.Property(i => i.UnitPrice)
            .HasColumnName("unit_price")
            .HasColumnType("numeric(12,2)")
            .IsRequired();

        builder.Property(i => i.TotalPrice)
            .HasColumnName("total_price")
            .HasColumnType("numeric(12,2)")
            .IsRequired();

        builder.HasOne(i => i.Invoice)
            .WithMany(inv => inv.Items)
            .HasForeignKey(i => i.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
