using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BillingInvoiceConfiguration : IEntityTypeConfiguration<BillingInvoice>
{
    public void Configure(EntityTypeBuilder<BillingInvoice> builder)
    {
        builder.ToTable("billing_invoices");

        builder.HasKey(i => i.InvoiceId);

        builder.Property(i => i.InvoiceId).HasColumnName("invoice_id");

        builder.Property(i => i.PatientId).HasColumnName("patient_id").IsRequired();

        builder.Property(i => i.ClaimId).HasColumnName("claim_id");

        builder
            .Property(i => i.InvoiceNumber)
            .HasColumnName("invoice_number")
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(i => i.InvoiceNumber).IsUnique();

        builder
            .Property(i => i.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder
            .Property(i => i.SubtotalAmount)
            .HasColumnName("subtotal_amount")
            .HasColumnType("numeric(12,2)")
            .IsRequired();

        builder
            .Property(i => i.CoveredAmount)
            .HasColumnName("covered_amount")
            .HasColumnType("numeric(12,2)")
            .IsRequired();

        builder
            .Property(i => i.PatientResponsibility)
            .HasColumnName("patient_responsibility")
            .HasColumnType("numeric(12,2)")
            .IsRequired();

        builder.Property(i => i.GeneratedAt).HasColumnName("generated_at").IsRequired();

        builder.Property(i => i.DueDate).HasColumnName("due_date").IsRequired();

        builder
            .HasOne(i => i.Patient)
            .WithMany()
            .HasForeignKey(i => i.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(i => i.Claim)
            .WithMany()
            .HasForeignKey(i => i.ClaimId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
