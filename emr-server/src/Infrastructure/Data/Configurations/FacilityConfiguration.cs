using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class FacilityConfiguration : IEntityTypeConfiguration<Facility>
{
    public void Configure(EntityTypeBuilder<Facility> builder)
    {
        builder.ToTable("facilities");

        builder.HasKey(f => f.FacilityId);

        builder.Property(f => f.FacilityId)
               .HasColumnName("facility_id");

        builder.Property(f => f.Name)
               .HasColumnName("name")
               .HasMaxLength(200)
               .IsRequired();

        builder.Property(f => f.Type)
               .HasColumnName("type")
               .HasConversion<string>();

        builder.OwnsOne(f => f.FacilityAddress, a =>
        {
            a.Property(p => p.Street).HasColumnName("facility_address_street");
            a.Property(p => p.City).HasColumnName("facility_address_city");
            a.Property(p => p.State).HasColumnName("facility_address_state");
            a.Property(p => p.PostalCode).HasColumnName("facility_address_postal_code");
            a.Property(p => p.Country).HasColumnName("facility_address_country");
            a.Property(p => p.Latitude).HasColumnName("facility_address_latitude");
            a.Property(p => p.Longitude).HasColumnName("facility_address_longitude");
        });
    }
}
