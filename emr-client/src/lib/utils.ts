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

