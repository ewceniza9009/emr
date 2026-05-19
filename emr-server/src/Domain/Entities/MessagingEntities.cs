using System;
using System.Collections.Generic;
using Domain.Common;

namespace Domain.Entities;

public class CareThread : BaseEntity, ITenantEntity
{
    public Guid CareThreadId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid PatientId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Patient Patient { get; set; } = null!;
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}

public class ChatMessage : BaseEntity, ITenantEntity
{
    public Guid ChatMessageId { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid CareThreadId { get; set; }
    
    public string SenderRole { get; set; } = string.Empty; // e.g., "patient" or "navigator"
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
    public bool IsAttachment { get; set; } = false;
    public bool IsSeen { get; set; } = false;

    public CareThread CareThread { get; set; } = null!;
}
