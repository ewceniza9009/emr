using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class AllergyConfiguration : IEntityTypeConfiguration<Allergy>
{
    public void Configure(EntityTypeBuilder<Allergy> builder)
    {
        builder.ToTable("allergies");

        builder.HasKey(a => a.AllergyId);

        builder.Property(a => a.AllergyId).HasColumnName("allergy_id");

        builder.Property(a => a.PatientId).HasColumnName("patient_id").IsRequired();

        builder.Property(a => a.Allergen).HasColumnName("allergen").HasMaxLength(100).IsRequired();

        builder
            .Property(a => a.Severity)
            .HasColumnName("severity")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(a => a.Reaction).HasColumnName("reaction").HasMaxLength(255);

        builder.Property(a => a.IdentifiedAt).HasColumnName("identified_at").IsRequired();

        builder
            .HasOne(a => a.Patient)
            .WithMany()
            .HasForeignKey(a => a.PatientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
