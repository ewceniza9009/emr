using Domain.Common;
using System;

namespace Domain.Entities;

public class MagicToken : BaseEntity, ITenantEntity
{
    public Guid MagicTokenId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; } // Multi-tenant isolation key
    public Guid PatientId { get; set; }
    public string TokenValue { get; set; } = string.Empty; // Encrypted token payload
    public string TokenHash { get; set; } = string.Empty; // SHA256 hash for secure O(1) DB lookup
    public string DeviceId { get; set; } = string.Empty; // Bound device identifier (MAC/UUID/etc)
    public bool IsCaregiver { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public bool IsUsed { get; set; } = false;

    // Navigation Properties
    public Patient Patient { get; set; } = null!;
}
