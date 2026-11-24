using System.Reflection;
using Application.Common.Interfaces;
using HotChocolate.Resolvers;
using HotChocolate.Types.Descriptors;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Api.GraphQL.Attributes;

/// <summary>
/// Tactical Security Middleware: Enforces Method-Level Patient Authorization.
/// Ensures that the requesting user is a Patient and is strictly accessing their own clinical records.
/// </summary>
public class UsePatientAccessAttribute(string argumentName = "patientId") : ObjectFieldDescriptorAttribute
{
    private sealed record CachedPatientIdentity(bool IsPatient, Guid PatientId);

    protected override void OnConfigure(
        IDescriptorContext context,
        IObjectFieldDescriptor descriptor,
        MemberInfo member
    )
    {
        descriptor.Use(next =>
            async (IMiddlewareContext ctx) =>
            {
                var currentUserService = ctx.Service<ICurrentUserService>();
                var userIdStr = currentUserService.UserId;
                if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out var userGuid))
                    throw new UnauthorizedAccessException("Mobile session expired or invalid.");

                var cacheKey = $"patient-access:{userGuid}";
                CachedPatientIdentity? identity = null;

                if (ctx.ContextData.TryGetValue(cacheKey, out var reqCached) && reqCached is CachedPatientIdentity reqIdentity)
                {
                    identity = reqIdentity;
                }
                else
                {
                    var memoryCache = ctx.Services.GetService<IMemoryCache>();
                    if (memoryCache == null || !memoryCache.TryGetValue(cacheKey, out identity))
                    {
                        var userManager = ctx.Service<UserManager<ApplicationUser>>();
                        var user = await userManager.FindByIdAsync(userIdStr);
                        if (user == null)
                            throw new UnauthorizedAccessException("Subject identity not found in registry.");

                        var roles = await userManager.GetRolesAsync(user);
                        var isPatient = roles.Any(r => r.Equals("Patient", StringComparison.OrdinalIgnoreCase));

                        var dbContext = ctx.Service<IApplicationDbContext>();
                        var ownedPatientId = await dbContext.PatientAccounts
                            .AsNoTracking()
                            .IgnoreQueryFilters()
                            .Where(pa => pa.UserId == userGuid)
                            .Select(pa => pa.PatientId)
                            .FirstOrDefaultAsync(ctx.RequestAborted);

                        identity = new CachedPatientIdentity(isPatient, ownedPatientId);
                        memoryCache?.Set(cacheKey, identity, TimeSpan.FromSeconds(60));
                    }

                    ctx.ContextData[cacheKey] = identity;
                }

                if (!identity!.IsPatient)
                {
                    throw new UnauthorizedAccessException("Access denied. This endpoint is strictly restricted to active Patient profiles.");
                }

                if (!string.IsNullOrEmpty(argumentName))
                {
                    Guid targetId = ResolveTargetId(ctx, argumentName);
                    if (targetId != Guid.Empty && (identity.PatientId == Guid.Empty || targetId != identity.PatientId))
                    {
                        throw new UnauthorizedAccessException("Tactical Security Violation: Patients may only access their own clinical records.");
                    }
                }

                await next(ctx);
            }
        );
    }

    private static Guid ResolveTargetId(IMiddlewareContext ctx, string name)
    {
        if (ctx.Selection.Field.Arguments.Any(a => a.Name.Equals(name, StringComparison.OrdinalIgnoreCase)))
        {
            try { return ctx.ArgumentValue<Guid>(name); } catch { }
        }

        foreach (var containerName in new[] { "input", "command" })
        {
            if (ctx.Selection.Field.Arguments.Any(a => a.Name == containerName))
            {
                try
                {
                    var container = ctx.ArgumentValue<object>(containerName);
                    if (container != null)
                    {
                        var prop = container.GetType().GetProperty(name, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                        if (prop != null && prop.GetValue(container) is Guid val)
                            return val;
                    }
                }
                catch { }
            }
        }

        return Guid.Empty;
    }
}
