using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class BarrierLogConfiguration : IEntityTypeConfiguration<BarrierLog>
{
    public void Configure(EntityTypeBuilder<BarrierLog> builder)
    {
        builder.ToTable("barrier_logs");

        builder.HasKey(b => b.BarrierId);

        builder.Property(b => b.BarrierId)
               .HasColumnName("barrier_id");

        builder.Property(b => b.CaseId)
               .HasColumnName("case_id")
               .IsRequired();

        builder.Property(b => b.BarrierCategory)
               .HasColumnName("barrier_category")
               .HasMaxLength(100)
               .IsRequired();

        builder.Property(b => b.Description)
               .HasColumnName("description")
               .IsRequired();

        builder.HasOne(b => b.CareNavigationCase)
               .WithMany(c => c.BarrierLogs)
               .HasForeignKey(b => b.CaseId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
