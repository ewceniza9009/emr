using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ZBenefitClaimConfiguration : IEntityTypeConfiguration<ZBenefitClaim>
{
    public void Configure(EntityTypeBuilder<ZBenefitClaim> builder)
    {
        builder.ToTable("z_benefit_claims");

        builder.HasKey(c => c.ClaimId);

        builder.Property(c => c.ClaimId)
               .HasColumnName("claim_id");

        builder.Property(c => c.PatientId)
               .HasColumnName("patient_id")
               .IsRequired();

        builder.Property(c => c.PhilhealthNumber)
               .HasColumnName("philhealth_number")
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(c => c.PackageCode)
               .HasColumnName("package_code")
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(c => c.Status)
               .HasColumnName("status")
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(c => c.TotalAmount)
               .HasColumnName("total_amount")
               .HasColumnType("numeric(12,2)")
               .IsRequired();

        builder.Property(c => c.CreatedAt)
               .HasColumnName("created_at")
               .IsRequired();

        builder.Property(c => c.SubmittedAt)
               .HasColumnName("submitted_at");

        builder.HasOne(c => c.Patient)
               .WithMany()
               .HasForeignKey(c => c.PatientId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
