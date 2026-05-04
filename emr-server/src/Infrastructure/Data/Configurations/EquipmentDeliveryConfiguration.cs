using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class EquipmentDeliveryConfiguration : IEntityTypeConfiguration<EquipmentDelivery>
{
    public void Configure(EntityTypeBuilder<EquipmentDelivery> builder)
    {
        builder.ToTable("equipment_deliveries");

        builder.HasKey(d => d.DeliveryId);

        builder.Property(d => d.DeliveryId).HasColumnName("delivery_id");

        builder.Property(d => d.EquipmentId).HasColumnName("equipment_id").IsRequired();

        builder.Property(d => d.PatientId).HasColumnName("patient_id").IsRequired();

        builder.Property(d => d.EncounterId).HasColumnName("encounter_id");

        builder
            .Property(d => d.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.RequestedAt).HasColumnName("requested_at").IsRequired();

        builder.Property(d => d.DeliveredAt).HasColumnName("delivered_at");

        builder.Property(d => d.DeliveryAddress).HasColumnName("delivery_address").IsRequired();

        builder
            .HasOne(d => d.Equipment)
            .WithMany(e => e.Deliveries)
            .HasForeignKey(d => d.EquipmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(d => d.Patient)
            .WithMany()
            .HasForeignKey(d => d.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasOne(d => d.Encounter)
            .WithMany()
            .HasForeignKey(d => d.EncounterId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
