using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ProviderShiftConfiguration : IEntityTypeConfiguration<ProviderShift>
{
    public void Configure(EntityTypeBuilder<ProviderShift> builder)
    {
        builder.ToTable("provider_shifts");

        builder.HasKey(ps => ps.ProviderShiftId);

        builder.Property(ps => ps.ProviderShiftId).HasColumnName("provider_shift_id");

        builder.Property(ps => ps.PractitionerId).HasColumnName("practitioner_id").IsRequired();

        builder.Property(ps => ps.DayOfWeek).HasColumnName("day_of_week").IsRequired();

        builder.Property(ps => ps.StartTime).HasColumnName("start_time").IsRequired();

        builder.Property(ps => ps.EndTime).HasColumnName("end_time").IsRequired();

        builder.Property(ps => ps.IsActive).HasColumnName("is_active").HasDefaultValue(true);

        builder
            .HasOne(ps => ps.Practitioner)
            .WithMany(p => p.Shifts)
            .HasForeignKey(ps => ps.PractitionerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
