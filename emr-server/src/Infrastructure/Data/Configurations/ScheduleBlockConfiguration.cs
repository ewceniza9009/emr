using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ScheduleBlockConfiguration : IEntityTypeConfiguration<ScheduleBlock>
{
    public void Configure(EntityTypeBuilder<ScheduleBlock> builder)
    {
        builder.ToTable("schedule_blocks");

        builder.HasKey(s => s.BlockId);

        builder.Property(s => s.BlockId)
               .HasColumnName("block_id");

        builder.Property(s => s.PractitionerId)
               .HasColumnName("practitioner_id")
               .IsRequired();

        builder.Property(s => s.StartTime)
               .HasColumnName("start_time")
               .IsRequired();

        builder.Property(s => s.EndTime)
               .HasColumnName("end_time")
               .IsRequired();

        builder.Property(s => s.Status)
               .HasColumnName("status")
               .HasConversion<string>()
               .HasMaxLength(20)
               .IsRequired();

        builder.HasOne(s => s.Practitioner)
               .WithMany()
               .HasForeignKey(s => s.PractitionerId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
