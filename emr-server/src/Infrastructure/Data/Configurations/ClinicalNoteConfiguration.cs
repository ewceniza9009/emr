using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class ClinicalNoteConfiguration : IEntityTypeConfiguration<ClinicalNote>
{
    public void Configure(EntityTypeBuilder<ClinicalNote> builder)
    {
        builder.ToTable("clinical_notes");

        builder.HasKey(n => n.NoteId);

        builder.Property(n => n.NoteId)
               .HasColumnName("note_id");

        builder.Property(n => n.EncounterId)
               .HasColumnName("encounter_id")
               .IsRequired();

        builder.Property(n => n.AuthorId)
               .HasColumnName("author_id")
               .IsRequired();

        builder.Property(n => n.Type)
               .HasColumnName("type")
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(n => n.Content)
               .HasColumnName("content")
               .IsRequired();

        builder.Property(n => n.CreatedAt)
               .HasColumnName("created_at")
               .IsRequired();

        builder.Property(n => n.IsSigned)
               .HasColumnName("is_signed")
               .HasDefaultValue(false);

        builder.HasOne(n => n.Encounter)
               .WithMany(e => e.ClinicalNotes)
               .HasForeignKey(n => n.EncounterId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Author)
               .WithMany()
               .HasForeignKey(n => n.AuthorId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
