using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class VitalSignConfiguration : IEntityTypeConfiguration<VitalSign>
{
    public void Configure(EntityTypeBuilder<VitalSign> builder)
    {
        builder.ToTable("vital_signs");

        builder.HasKey(v => v.VitalId);

        builder.Property(v => v.VitalId).HasColumnName("vital_id");

        builder.Property(v => v.EncounterId).HasColumnName("encounter_id").IsRequired();

        builder
            .Property(v => v.HeartRate)
            .HasColumnName("heart_rate")
            .HasColumnType("numeric(5,2)");

        builder
            .Property(v => v.BloodPressureSystolic)
            .HasColumnName("blood_pressure_systolic")
            .HasColumnType("numeric(5,2)");

        builder
            .Property(v => v.BloodPressureDiastolic)
            .HasColumnName("blood_pressure_diastolic")
            .HasColumnType("numeric(5,2)");

        builder
            .Property(v => v.RespiratoryRate)
            .HasColumnName("respiratory_rate")
            .HasColumnType("numeric(5,2)");

        builder
            .Property(v => v.Temperature)
            .HasColumnName("temperature")
            .HasColumnType("numeric(5,2)");

        builder
            .Property(v => v.OxygenSaturation)
            .HasColumnName("oxygen_saturation")
            .HasColumnType("numeric(5,2)");

        builder
            .Property(v => v.Weight)
            .HasColumnName("weight")
            .HasColumnType("numeric(5,2)");

        builder.Property(v => v.RecordedAt).HasColumnName("recorded_at").IsRequired();

        builder
            .HasOne(v => v.Encounter)
            .WithMany(e => e.VitalSigns)
            .HasForeignKey(v => v.EncounterId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
