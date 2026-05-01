using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class SdohAssessmentConfiguration : IEntityTypeConfiguration<SdohAssessment>
{
    public void Configure(EntityTypeBuilder<SdohAssessment> builder)
    {
        builder.ToTable("sdoh_assessments");

        builder.HasKey(s => s.SdohId);

        builder.Property(s => s.SdohId)
               .HasColumnName("sdoh_id");

        builder.Property(s => s.CaseId)
               .HasColumnName("case_id")
               .IsRequired();

        builder.Property(s => s.AssessorId)
               .HasColumnName("assessor_id")
               .IsRequired();

        builder.Property(s => s.FoodInsecurity)
               .HasColumnName("food_insecurity")
               .HasDefaultValue(false);

        builder.Property(s => s.HousingInstability)
               .HasColumnName("housing_instability")
               .HasDefaultValue(false);

        builder.Property(s => s.TransportationBarrier)
               .HasColumnName("transportation_barrier")
               .HasDefaultValue(false);

        builder.Property(s => s.FinancialToxicity)
               .HasColumnName("financial_toxicity")
               .HasDefaultValue(false);

        builder.Property(s => s.AssessedAt)
               .HasColumnName("assessed_at")
               .IsRequired();

        builder.HasOne(s => s.CareNavigationCase)
               .WithMany(c => c.SdohAssessments)
               .HasForeignKey(s => s.CaseId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(s => s.Assessor)
               .WithMany()
               .HasForeignKey(s => s.AssessorId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
