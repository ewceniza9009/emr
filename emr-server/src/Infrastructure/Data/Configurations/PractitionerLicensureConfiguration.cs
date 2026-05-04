using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PractitionerLicensureConfiguration : IEntityTypeConfiguration<PractitionerLicensure>
{
    public void Configure(EntityTypeBuilder<PractitionerLicensure> builder)
    {
        builder.ToTable("practitioner_licensures");

        builder.HasKey(l => l.LicensureId);

        builder.Property(l => l.LicensureId).HasColumnName("licensure_id");

        builder.Property(l => l.PractitionerId).HasColumnName("practitioner_id").IsRequired();

        builder
            .Property(l => l.LicenseNumber)
            .HasColumnName("license_number")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(l => l.State).HasColumnName("state").HasMaxLength(50).IsRequired();

        builder.Property(l => l.ExpiryDate).HasColumnName("expiry_date").IsRequired();

        builder.Property(l => l.IsActive).HasColumnName("is_active").HasDefaultValue(true);

        builder
            .HasOne(l => l.Practitioner)
            .WithMany(p => p.Licensures)
            .HasForeignKey(l => l.PractitionerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
