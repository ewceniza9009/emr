using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TelemetryLogConfiguration : IEntityTypeConfiguration<TelemetryLog>
{
    public void Configure(EntityTypeBuilder<TelemetryLog> builder)
    {
        builder.ToTable("telemetry_logs");

        builder.HasKey(l => l.LogId);

        builder.Property(l => l.LogId)
               .HasColumnName("log_id");

        builder.Property(l => l.EquipmentId)
               .HasColumnName("equipment_id")
               .IsRequired();

        builder.Property(l => l.SensorType)
               .HasColumnName("sensor_type")
               .HasMaxLength(100)
               .IsRequired();

        builder.Property(l => l.Value)
               .HasColumnName("sensor_value")
               .HasColumnType("numeric(12,4)")
               .IsRequired();

        builder.Property(l => l.Unit)
               .HasColumnName("unit")
               .HasMaxLength(20)
               .IsRequired();

        builder.Property(l => l.RecordedAt)
               .HasColumnName("recorded_at")
               .IsRequired();

        builder.HasOne(l => l.Equipment)
               .WithMany(e => e.TelemetryLogs)
               .HasForeignKey(l => l.EquipmentId)
               .OnDelete(DeleteBehavior.Cascade);
               
        // Index for fast telemetry queries over time
        builder.HasIndex(l => new { l.EquipmentId, l.RecordedAt });
    }
}
