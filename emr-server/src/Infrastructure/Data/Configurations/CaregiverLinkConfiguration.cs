using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CaregiverLinkConfiguration : IEntityTypeConfiguration<CaregiverLink>
{
    public void Configure(EntityTypeBuilder<CaregiverLink> builder)
    {
        builder.ToTable("caregiver_links");

        builder.HasKey(cl => cl.CaregiverLinkId);

        builder.Property(cl => cl.CaregiverLinkId)
            .HasColumnName("caregiver_link_id");

        builder.Property(cl => cl.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        builder.Property(cl => cl.PatientAccountId)
            .HasColumnName("patient_account_id")
            .IsRequired();

        builder.Property(cl => cl.CaregiverUserId)
            .HasColumnName("caregiver_user_id");

        builder.Property(cl => cl.FirstName)
            .HasColumnName("first_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(cl => cl.LastName)
            .HasColumnName("last_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(cl => cl.Relationship)
            .HasColumnName("relationship")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(cl => cl.Email)
            .HasColumnName("email")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(cl => cl.PhoneNumber)
            .HasColumnName("phone_number")
            .HasMaxLength(50);

        builder.Property(cl => cl.IsPrimary)
            .HasColumnName("is_primary")
            .HasDefaultValue(false);

        builder.Property(cl => cl.AccessGranted)
            .HasColumnName("access_granted")
            .HasDefaultValue(true);

        // One-to-Many: A patient account can be linked to multiple caregivers
        builder.HasOne(cl => cl.PatientAccount)
            .WithMany(pa => pa.CaregiverLinks)
            .HasForeignKey(cl => cl.PatientAccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
