using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class SpiritualAssessmentConfiguration : IEntityTypeConfiguration<SpiritualAssessment>
{
    public void Configure(EntityTypeBuilder<SpiritualAssessment> builder)
    {
        builder.ToTable("spiritual_assessments");

        builder.HasKey(s => s.SpiritualAssessmentId);
        builder.Property(s => s.SpiritualAssessmentId).HasColumnName("spiritual_assessment_id");

        builder.Property(s => s.EncounterId).HasColumnName("encounter_id");
        builder.Property(s => s.PatientId).HasColumnName("patient_id");

        builder.Property(s => s.Faith).HasColumnName("faith");
        builder.Property(s => s.Importance).HasColumnName("importance");
        builder.Property(s => s.Community).HasColumnName("community");
        builder.Property(s => s.AddressInCare).HasColumnName("address_in_care");
        builder.Property(s => s.ReligiousPreference).HasColumnName("religious_preference");
        builder.Property(s => s.ClergyContact).HasColumnName("clergy_contact");

        builder.HasOne(s => s.ClinicalEncounter)
            .WithMany()
            .HasForeignKey(s => s.EncounterId)
            .HasConstraintName("fk_spiritual_assessments_clinical_encounters_encounter_id");

        builder.HasOne(s => s.Patient)
            .WithMany()
            .HasForeignKey(s => s.PatientId)
            .HasConstraintName("fk_spiritual_assessments_patients_patient_id");
    }
}
