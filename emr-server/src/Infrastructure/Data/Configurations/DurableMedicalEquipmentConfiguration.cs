using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class DurableMedicalEquipmentConfiguration : IEntityTypeConfiguration<DurableMedicalEquipment>
{
    public void Configure(EntityTypeBuilder<DurableMedicalEquipment> builder)
    {
        builder.ToTable("durable_medical_equipment");

        builder.HasKey(e => e.EquipmentId);

        builder.Property(e => e.EquipmentId)
               .HasColumnName("equipment_id");

        builder.Property(e => e.SerialNumber)
               .HasColumnName("serial_number")
               .HasMaxLength(100)
               .IsRequired();
               
        builder.HasIndex(e => e.SerialNumber).IsUnique();

        builder.Property(e => e.ModelName)
               .HasColumnName("model_name")
               .HasMaxLength(255)
               .IsRequired();

        builder.Property(e => e.Type)
               .HasColumnName("equipment_type")
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(e => e.Status)
               .HasColumnName("status")
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(e => e.LastMaintenanceDate)
               .HasColumnName("last_maintenance_date")
               .IsRequired();
    }
}
