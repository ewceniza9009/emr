using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class DiagnosisConfiguration : IEntityTypeConfiguration<Diagnosis>
{
    public void Configure(EntityTypeBuilder<Diagnosis> builder)
    {
        builder.ToTable("diagnoses");

        builder.HasKey(d => d.DiagnosisId);

        builder.Property(d => d.DiagnosisId)
               .HasColumnName("diagnosis_id");

        builder.Property(d => d.PatientId)
               .HasColumnName("patient_id")
               .IsRequired();

        builder.Property(d => d.EncounterId)
               .HasColumnName("encounter_id");

        builder.Property(d => d.Icd10Code)
               .HasColumnName("icd10_code")
               .HasMaxLength(20)
               .IsRequired();

        builder.Property(d => d.Description)
               .HasColumnName("description")
               .IsRequired();

        builder.Property(d => d.IsPrimary)
               .HasColumnName("is_primary")
               .HasDefaultValue(false);

        builder.Property(d => d.DiagnosedAt)
               .HasColumnName("diagnosed_at")
               .IsRequired();

        builder.HasOne(d => d.Patient)
               .WithMany()
               .HasForeignKey(d => d.PatientId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Encounter)
               .WithMany(e => e.Diagnoses)
               .HasForeignKey(d => d.EncounterId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
