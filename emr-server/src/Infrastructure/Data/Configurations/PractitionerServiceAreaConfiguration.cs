using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class PractitionerServiceAreaConfiguration : IEntityTypeConfiguration<PractitionerServiceArea>
{
    public void Configure(EntityTypeBuilder<PractitionerServiceArea> builder)
    {
        builder.ToTable("practitioner_service_areas");

        builder.HasKey(s => s.ServiceAreaId);

        builder.Property(s => s.ServiceAreaId)
               .HasColumnName("service_area_id");

        builder.Property(s => s.PractitionerId)
               .HasColumnName("practitioner_id")
               .IsRequired();

        builder.Property(s => s.ZipCode)
               .HasColumnName("zip_code")
               .HasMaxLength(20)
               .IsRequired();

        builder.Property(s => s.County)
               .HasColumnName("county")
               .HasMaxLength(100);

        builder.HasOne(s => s.Practitioner)
               .WithMany(p => p.ServiceAreas)
               .HasForeignKey(s => s.PractitionerId)
               .OnDelete(DeleteBehavior.Cascade);
               
        // Index for fast zip code lookups
        builder.HasIndex(s => s.ZipCode);
    }
}
