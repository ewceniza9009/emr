using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class IntegrationProfileConfiguration : IEntityTypeConfiguration<IntegrationProfile>
{
    public void Configure(EntityTypeBuilder<IntegrationProfile> builder)
    {
        builder.ToTable("integration_profiles");

        builder.HasKey(i => i.IntegrationProfileId);
        builder.Property(i => i.IntegrationProfileId).HasColumnName("integration_profile_id");

        builder.Property(i => i.Partner).HasColumnName("partner").HasConversion<string>();
        builder.Property(i => i.ApiKey).HasColumnName("api_key");
        builder.Property(i => i.BaseUrl).HasColumnName("base_url");
        builder.Property(i => i.WebhookSecret).HasColumnName("webhook_secret");
        builder.Property(i => i.LastSyncAt).HasColumnName("last_sync_at");
        builder.Property(i => i.IsActive).HasColumnName("is_active");
        builder.Property(i => i.SettingsJson).HasColumnName("settings_json").HasColumnType("jsonb");
    }
}
