using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        builder.ToTable("patients");

        builder.HasKey(p => p.PatientId);
        
        builder.Property(p => p.PatientId)
               .HasColumnName("patient_id");

        builder.Property(p => p.Mrn)
               .HasColumnName("mrn")
               .HasMaxLength(50)
               .IsRequired();
               
        builder.HasIndex(p => p.Mrn).IsUnique();

        builder.Property(p => p.FirstName)
               .HasColumnName("first_name")
               .HasMaxLength(100)
               .IsRequired();

        builder.Property(p => p.LastName)
               .HasColumnName("last_name")
               .HasMaxLength(100)
               .IsRequired();

        builder.Property(p => p.Dob)
               .HasColumnName("dob")
               .IsRequired();

        builder.Property(p => p.BiologicalSex)
               .HasColumnName("biological_sex")
               .HasMaxLength(20)
               .IsRequired();

        builder.Property(p => p.GenderIdentity)
               .HasColumnName("gender_identity")
               .HasMaxLength(50);

        builder.Property(p => p.PhilhealthNumber)
               .HasColumnName("philhealth_number")
               .HasMaxLength(50);

        builder.HasIndex(p => p.PhilhealthNumber).IsUnique();

        builder.Property(p => p.Address)
               .HasColumnName("address")
               .IsRequired();

        builder.Property(p => p.City)
               .HasColumnName("city")
               .HasMaxLength(100)
               .IsRequired();

        builder.Property(p => p.PostalCode)
               .HasColumnName("postal_code")
               .HasMaxLength(20);

        builder.Property(p => p.CreatedAt)
               .HasColumnName("created_at")
               .HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}
