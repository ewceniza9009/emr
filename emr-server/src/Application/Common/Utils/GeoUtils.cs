using System;

namespace Application.Common.Utils;

public static class GeoUtils
{
    private const double EarthRadiusMiles = 3958.8;

    public static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
            + Math.Cos(ToRadians(lat1))
                * Math.Cos(ToRadians(lat2))
                * Math.Sin(dLon / 2)
                * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusMiles * c;
    }

    public static double EstimateTravelTimeMinutes(double miles)
    {
        // Average speed of 30 mph for urban/suburban mix
        const double AverageSpeedMph = 30.0;
        return (miles / AverageSpeedMph) * 60;
    }

    private static double ToRadians(double angle)
    {
        return Math.PI * angle / 180.0;
    }
}
