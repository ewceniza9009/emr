using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class CareNavigationCaseConfiguration : IEntityTypeConfiguration<CareNavigationCase>
{
    public void Configure(EntityTypeBuilder<CareNavigationCase> builder)
    {
        builder.ToTable("care_navigation_cases");

        builder.HasKey(c => c.CaseId);

        builder.Property(c => c.CaseId)
               .HasColumnName("case_id");

        builder.Property(c => c.PatientId)
               .HasColumnName("patient_id")
               .IsRequired();

        builder.Property(c => c.NavigatorId)
               .HasColumnName("navigator_id")
               .IsRequired();

        builder.Property(c => c.AcuityLevel)
               .HasColumnName("acuity_level")
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(c => c.Status)
               .HasColumnName("status")
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(c => c.OpenedAt)
               .HasColumnName("opened_at")
               .IsRequired();

        builder.HasOne(c => c.Patient)
               .WithMany()
               .HasForeignKey(c => c.PatientId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Navigator)
               .WithMany()
               .HasForeignKey(c => c.NavigatorId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
