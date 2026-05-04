using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ClinicalEncounterConfiguration : IEntityTypeConfiguration<ClinicalEncounter>
{
    public void Configure(EntityTypeBuilder<ClinicalEncounter> builder)
    {
        builder.ToTable("clinical_encounters");

        builder.HasKey(e => e.EncounterId);

        builder.Property(e => e.EncounterId).HasColumnName("encounter_id");

        builder.Property(e => e.PatientId).HasColumnName("patient_id").IsRequired();

        builder.Property(e => e.PractitionerId).HasColumnName("practitioner_id").IsRequired();

        builder.Property(e => e.AppointmentId).HasColumnName("appointment_id");

        builder
            .Property(e => e.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.AdmittedAt).HasColumnName("admitted_at");

        builder.Property(e => e.DischargedAt).HasColumnName("discharged_at");

        builder
            .HasOne(e => e.Patient)
            .WithMany()
            .HasForeignKey(e => e.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(e => e.Practitioner)
            .WithMany()
            .HasForeignKey(e => e.PractitionerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(e => e.Appointment)
            .WithMany()
            .HasForeignKey(e => e.AppointmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
