using Application.Common.Dtos;
using Domain.Entities;
using Mapster;

namespace Application.Common.Mappings;

public class SecurityAuditLogMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<SecurityAuditLog, SecurityAuditLogDto>()
            .Map(dest => dest.AuditLogId, src => src.SecurityAuditLogId)
            .Map(dest => dest.UserId, src => src.ActorUserId)
            .Map(dest => dest.UserName, src => src.ActorName)
            .Map(dest => dest.Timestamp, src => src.CreatedAt);
    }
}
