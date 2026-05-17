using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PatientAccountConfiguration : IEntityTypeConfiguration<PatientAccount>
{
    public void Configure(EntityTypeBuilder<PatientAccount> builder)
    {
        builder.ToTable("patient_accounts");

        builder.HasKey(pa => pa.PatientAccountId);

        builder.Property(pa => pa.PatientAccountId)
            .HasColumnName("patient_account_id");

        builder.Property(pa => pa.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        builder.Property(pa => pa.PatientId)
            .HasColumnName("patient_id")
            .IsRequired();

        builder.Property(pa => pa.UserId)
            .HasColumnName("user_id")
            .IsRequired();

        builder.Property(pa => pa.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(pa => pa.LastLoginAt)
            .HasColumnName("last_login_at");

        // 1-to-1 relationship: A patient has at most one portal account
        builder.HasOne(pa => pa.Patient)
            .WithOne(p => p.PatientAccount)
            .HasForeignKey<PatientAccount>(pa => pa.PatientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
