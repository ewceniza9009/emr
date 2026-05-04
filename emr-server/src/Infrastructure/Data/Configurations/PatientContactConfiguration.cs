using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PatientContactConfiguration : IEntityTypeConfiguration<PatientContact>
{
    public void Configure(EntityTypeBuilder<PatientContact> builder)
    {
        builder.ToTable("patient_contacts");

        builder.HasKey(c => c.ContactId);

        builder.Property(c => c.ContactId).HasColumnName("contact_id");

        builder.Property(c => c.PatientId).HasColumnName("patient_id").IsRequired();

        builder
            .Property(c => c.FirstName)
            .HasColumnName("first_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(c => c.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();

        builder
            .Property(c => c.Relationship)
            .HasColumnName("relationship")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(c => c.PhoneNumber).HasColumnName("phone_number").HasMaxLength(50);

        builder.Property(c => c.Email).HasColumnName("email").HasMaxLength(255);

        builder
            .Property(c => c.IsPrimaryContact)
            .HasColumnName("is_primary_contact")
            .HasDefaultValue(false);

        builder
            .Property(c => c.HasPowerOfAttorney)
            .HasColumnName("has_power_of_attorney")
            .HasDefaultValue(false);

        builder
            .HasOne(c => c.Patient)
            .WithMany(p => p.Contacts)
            .HasForeignKey(c => c.PatientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
