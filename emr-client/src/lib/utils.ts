import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { DEFAULT_TENANT } from "./SettingsContext";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string or object into a human-readable format 
 * using the global DEFAULT_TENANT timezone.
 */
export function formatDate(date: string | Date | number, options: Intl.DateTimeFormatOptions = {}) {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const locale = DEFAULT_TENANT.language === 'en' ? 'en-PH' : DEFAULT_TENANT.language;

  return new Intl.DateTimeFormat(locale, {
    timeZone: DEFAULT_TENANT.timezone,
    ...options
  }).format(d);
}

/**
 * Formats a date specifically for clinical timestamps.
 */
export function formatClinicalTime(date: string | Date | number) {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a date specifically for clinical logs.
 */
export function formatClinicalDate(date: string | Date | number) {
  return formatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}


/**
 * Formats a raw database/GraphQL enum value into a user-friendly string.
 * Example:
 * - "ASSISTED_LIVING" -> "Assisted Living"
 * - "InProgress" -> "In Progress"
 * - "HOSPITAL" -> "Hospital"
 */
export function formatEnum(val: string | null | undefined): string {
  if (!val) return "";
  
  // 1. If it has underscores, split by underscores
  if (val.includes('_')) {
    return val
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // 2. Handle mixedCase or CamelCase (e.g., InProgress)
  // Put a space before any uppercase letter followed by lowercase, or between lowercase and uppercase
  let formatted = val
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
    
  // 3. Capitalize first letter of each word
  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
