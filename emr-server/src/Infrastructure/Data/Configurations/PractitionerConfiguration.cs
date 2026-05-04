using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PractitionerConfiguration : IEntityTypeConfiguration<Practitioner>
{
    public void Configure(EntityTypeBuilder<Practitioner> builder)
    {
        builder.ToTable("practitioners");

        builder.HasKey(p => p.PractitionerId);

        builder.Property(p => p.PractitionerId).HasColumnName("practitioner_id");

        builder.Property(p => p.UserId).HasColumnName("user_id").IsRequired();

        builder.HasIndex(p => p.UserId).IsUnique();

        builder
            .Property(p => p.FirstName)
            .HasColumnName("first_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(p => p.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();

        builder
            .Property(p => p.PrcLicenseNumber)
            .HasColumnName("prc_license_number")
            .HasMaxLength(50);

        builder.HasIndex(p => p.PrcLicenseNumber).IsUnique();

        builder.Property(p => p.NpiNumber).HasColumnName("npi_number").HasMaxLength(50);

        builder.HasIndex(p => p.NpiNumber).IsUnique();

        builder.Property(p => p.IsActive).HasColumnName("is_active").HasDefaultValue(true);

        builder.Property(p => p.Position).HasColumnName("position").HasConversion<string>();

        builder
            .Property(p => p.IsCareNavigator)
            .HasColumnName("is_care_navigator")
            .HasDefaultValue(false);

        builder
            .Property(p => p.IsSupportingClinician)
            .HasColumnName("is_supporting_clinician")
            .HasDefaultValue(false);

        builder
            .HasMany(p => p.Addresses)
            .WithOne(a => a.Practitioner)
            .HasForeignKey(a => a.PractitionerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
