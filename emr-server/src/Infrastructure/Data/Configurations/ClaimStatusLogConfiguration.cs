using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ClaimStatusLogConfiguration : IEntityTypeConfiguration<ClaimStatusLog>
{
    public void Configure(EntityTypeBuilder<ClaimStatusLog> builder)
    {
        builder.ToTable("claim_status_logs");

        builder.HasKey(l => l.LogId);

        builder.Property(l => l.LogId).HasColumnName("log_id");

        builder.Property(l => l.ClaimId).HasColumnName("claim_id").IsRequired();

        builder
            .Property(l => l.PreviousStatus)
            .HasColumnName("previous_status")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder
            .Property(l => l.NewStatus)
            .HasColumnName("new_status")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder
            .Property(l => l.ChangedBy)
            .HasColumnName("changed_by")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(l => l.Remarks).HasColumnName("remarks");

        builder.Property(l => l.ChangedAt).HasColumnName("changed_at").IsRequired();

        builder
            .HasOne(l => l.Claim)
            .WithMany(c => c.StatusLogs)
            .HasForeignKey(l => l.ClaimId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
