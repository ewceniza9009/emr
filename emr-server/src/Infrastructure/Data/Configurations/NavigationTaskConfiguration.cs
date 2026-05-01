using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class NavigationTaskConfiguration : IEntityTypeConfiguration<NavigationTask>
{
    public void Configure(EntityTypeBuilder<NavigationTask> builder)
    {
        builder.ToTable("navigation_tasks");

        builder.HasKey(t => t.TaskId);

        builder.Property(t => t.TaskId)
               .HasColumnName("task_id");

        builder.Property(t => t.CaseId)
               .HasColumnName("case_id")
               .IsRequired();

        builder.Property(t => t.AssignedToId)
               .HasColumnName("assigned_to")
               .IsRequired();

        builder.Property(t => t.Description)
               .HasColumnName("description")
               .IsRequired();

        builder.Property(t => t.DueDate)
               .HasColumnName("due_date")
               .IsRequired();

        builder.Property(t => t.Status)
               .HasColumnName("status")
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.HasOne(t => t.CareNavigationCase)
               .WithMany(c => c.Tasks)
               .HasForeignKey(t => t.CaseId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(t => t.AssignedTo)
               .WithMany()
               .HasForeignKey(t => t.AssignedToId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
