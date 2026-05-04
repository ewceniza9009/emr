using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class InterventionLogConfiguration : IEntityTypeConfiguration<InterventionLog>
{
    public void Configure(EntityTypeBuilder<InterventionLog> builder)
    {
        builder.ToTable("intervention_logs");

        builder.HasKey(i => i.InterventionId);

        builder.Property(i => i.InterventionId).HasColumnName("intervention_id");

        builder.Property(i => i.CaseId).HasColumnName("case_id").IsRequired();

        builder.Property(i => i.ActionTaken).HasColumnName("action_taken").IsRequired();

        builder.Property(i => i.LoggedAt).HasColumnName("logged_at").IsRequired();

        builder
            .HasOne(i => i.CareNavigationCase)
            .WithMany(c => c.InterventionLogs)
            .HasForeignKey(i => i.CaseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
