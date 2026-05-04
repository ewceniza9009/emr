using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PatientOutreachConfiguration : IEntityTypeConfiguration<PatientOutreach>
{
    public void Configure(EntityTypeBuilder<PatientOutreach> builder)
    {
        builder.ToTable("patient_outreaches");

        builder.HasKey(p => p.PatientOutreachId);

        builder.Property(p => p.PatientOutreachId).HasColumnName("patient_outreach_id");

        builder
            .Property(p => p.FirstName)
            .HasColumnName("first_name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(p => p.LastName).HasColumnName("last_name").HasMaxLength(100).IsRequired();

        builder.OwnsOne(
            p => p.MailingAddress,
            a =>
            {
                a.Property(p => p.Street).HasColumnName("mailing_address_street");
                a.Property(p => p.City).HasColumnName("mailing_address_city");
                a.Property(p => p.State).HasColumnName("mailing_address_state");
                a.Property(p => p.PostalCode).HasColumnName("mailing_address_postal_code");
                a.Property(p => p.Country).HasColumnName("mailing_address_country");
            }
        );

        builder.Property(p => p.PrimaryPhone).HasColumnName("primary_phone").HasMaxLength(20);

        builder.Property(p => p.Status).HasColumnName("status").HasConversion<string>();

        builder
            .Property(p => p.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}
