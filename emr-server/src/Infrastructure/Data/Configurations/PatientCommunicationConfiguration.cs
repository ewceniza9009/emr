using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PatientPhoneConfiguration : IEntityTypeConfiguration<PatientPhone>
{
    public void Configure(EntityTypeBuilder<PatientPhone> builder)
    {
        builder.ToTable("patient_phones");

        builder.HasKey(p => p.PhoneId);

        builder.Property(p => p.PhoneId)
               .HasColumnName("phone_id");

        builder.Property(p => p.PatientId)
               .HasColumnName("patient_id")
               .IsRequired();

        builder.Property(p => p.PhoneNumber)
               .HasColumnName("phone_number")
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(p => p.Type)
               .HasColumnName("phone_type")
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(p => p.IsPrimary)
               .HasColumnName("is_primary")
               .HasDefaultValue(false);

        builder.HasOne(p => p.Patient)
               .WithMany(pt => pt.Phones)
               .HasForeignKey(p => p.PatientId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PatientEmailConfiguration : IEntityTypeConfiguration<PatientEmail>
{
    public void Configure(EntityTypeBuilder<PatientEmail> builder)
    {
        builder.ToTable("patient_emails");

        builder.HasKey(e => e.EmailId);

        builder.Property(e => e.EmailId)
               .HasColumnName("email_id");

        builder.Property(e => e.PatientId)
               .HasColumnName("patient_id")
               .IsRequired();

        builder.Property(e => e.EmailAddress)
               .HasColumnName("email_address")
               .HasMaxLength(255)
               .IsRequired();

        builder.Property(e => e.Type)
               .HasColumnName("email_type")
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(e => e.IsPrimary)
               .HasColumnName("is_primary")
               .HasDefaultValue(false);

        builder.HasOne(e => e.Patient)
               .WithMany(pt => pt.Emails)
               .HasForeignKey(e => e.PatientId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
