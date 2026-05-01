using System.Resources;

namespace Domain.Extensions;

public static class EnumExtensions
{
    private static readonly ResourceManager ResourceManager = 
        new ResourceManager("Domain.Resources.EnumResources", typeof(EnumExtensions).Assembly);

    public static string GetDisplayName(this Enum value)
    {
        var resourceKey = $"{value.GetType().Name}.{value.ToString()}";
        var displayName = ResourceManager.GetString(resourceKey);
        
        return string.IsNullOrWhiteSpace(displayName) ? value.ToString() : displayName;
    }
}
