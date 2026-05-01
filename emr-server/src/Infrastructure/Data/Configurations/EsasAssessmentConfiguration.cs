using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class EsasAssessmentConfiguration : IEntityTypeConfiguration<EsasAssessment>
{
    public void Configure(EntityTypeBuilder<EsasAssessment> builder)
    {
        builder.ToTable("esas_assessments");

        builder.HasKey(e => e.AssessmentId);

        builder.Property(e => e.AssessmentId)
               .HasColumnName("assessment_id");

        builder.Property(e => e.PatientId)
               .HasColumnName("patient_id")
               .IsRequired();

        builder.Property(e => e.EncounterId)
               .HasColumnName("encounter_id");

        // The 0-10 symptom scores
        builder.Property(e => e.Pain).HasColumnName("pain");
        builder.Property(e => e.Tiredness).HasColumnName("tiredness");
        builder.Property(e => e.Drowsiness).HasColumnName("drowsiness");
        builder.Property(e => e.Nausea).HasColumnName("nausea");
        builder.Property(e => e.LackOfAppetite).HasColumnName("lack_of_appetite");
        builder.Property(e => e.ShortnessOfBreath).HasColumnName("shortness_of_breath");
        builder.Property(e => e.Depression).HasColumnName("depression");
        builder.Property(e => e.Anxiety).HasColumnName("anxiety");
        builder.Property(e => e.Wellbeing).HasColumnName("wellbeing");

        builder.Property(e => e.AssessedAt)
               .HasColumnName("assessed_at")
               .IsRequired();

        builder.HasOne(e => e.Patient)
               .WithMany(p => p.EsasAssessments)
               .HasForeignKey(e => e.PatientId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Encounter)
               .WithMany()
               .HasForeignKey(e => e.EncounterId)
               .OnDelete(DeleteBehavior.SetNull);
    }
}
