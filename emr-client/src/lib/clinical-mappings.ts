/**
 * Halkyone Clinical Mapping & Migration Utility
 * 
 * This utility handles translations between legacy client-side identifiers
 * and the finalized HotChocolate GraphQL schema patterns.
 * 
 * TODO: Deprecate and remove once all LocalStorage persistence versions < v5 are purged.
 */

export const migrateDirectiveType = (type: string): string => {
  if (!type) return type;

  const map: Record<string, string> = {
    "DNR": "DNR",
    "DNI": "DNI",
    "FULLCODE": "FULL_CODE",
    "LIVINGWILL": "LIVING_WILL",
    "HEALTHCAREPROXY": "HEALTHCARE_PROXY",
    "COMFORTMEASURESONLY": "COMFORT_MEASURES_ONLY"
  };

  // Check for screaming snake or legacy all-caps
  const normalized = type.toUpperCase().replace(/_/g, "");
  return map[normalized] || type;
};

