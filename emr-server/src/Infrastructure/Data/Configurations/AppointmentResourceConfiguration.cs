using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class AppointmentResourceConfiguration : IEntityTypeConfiguration<AppointmentResource>
{
    public void Configure(EntityTypeBuilder<AppointmentResource> builder)
    {
        builder.ToTable("appointment_resources");

        builder.HasKey(ar => new { ar.AppointmentId, ar.BlockId });

        builder.Property(ar => ar.AppointmentId).HasColumnName("appointment_id");

        builder.Property(ar => ar.BlockId).HasColumnName("block_id");

        builder
            .HasOne(ar => ar.Appointment)
            .WithMany(a => a.AppointmentResources)
            .HasForeignKey(ar => ar.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(ar => ar.ScheduleBlock)
            .WithMany(s => s.AppointmentResources)
            .HasForeignKey(ar => ar.BlockId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
