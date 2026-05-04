import { CLINICAL_CONFIG } from "./clinical-config";

/**
 * Formats a date string or object into a human-readable format 
 * using the global CLINICAL_CONFIG timezone.
 */
export function formatDate(date: string | Date | number, options: Intl.DateTimeFormatOptions = {}) {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(CLINICAL_CONFIG.LOCALE, {
    timeZone: CLINICAL_CONFIG.TIMEZONE,
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
