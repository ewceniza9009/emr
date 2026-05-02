using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class EntityAddressConfiguration : IEntityTypeConfiguration<EntityAddress>
{
    public void Configure(EntityTypeBuilder<EntityAddress> builder)
    {
        builder.ToTable("entity_addresses");

        builder.HasKey(a => a.EntityAddressId);
        
        builder.Property(a => a.EntityAddressId)
               .HasColumnName("entity_address_id");

        builder.Property(a => a.PatientId)
               .HasColumnName("patient_id");

        builder.Property(a => a.PractitionerId)
               .HasColumnName("practitioner_id");

        builder.OwnsOne(a => a.Address, addr =>
        {
            addr.Property(p => p.Street).HasColumnName("street");
            addr.Property(p => p.City).HasColumnName("city");
            addr.Property(p => p.State).HasColumnName("state");
            addr.Property(p => p.PostalCode).HasColumnName("postal_code");
            addr.Property(p => p.Country).HasColumnName("country");
            addr.Property(p => p.Latitude).HasColumnName("latitude");
            addr.Property(p => p.Longitude).HasColumnName("longitude");
        });

        builder.Property(a => a.Type)
               .HasColumnName("type")
               .HasConversion<string>();

        builder.Property(a => a.IsPrimary)
               .HasColumnName("is_primary");

        builder.Property(a => a.CreatedAt)
               .HasColumnName("created_at")
               .HasDefaultValueSql("CURRENT_TIMESTAMP");
    }
}
