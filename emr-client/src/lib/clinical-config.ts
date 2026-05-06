/**
 * Global Clinical & Operational Configuration (Halcyon OS)
 * This is the single source of truth for temporal and operational constants.
 */

export const CLINICAL_CONFIG = {
  // Timezone Settings
  TIMEZONE: "Asia/Manila",
  LOCALE: "en-PH",

  // Scheduling Logic
  AM_START: 8,
  PM_START: 13,
  CUTOFF_HOUR: 12,
  DAY_END: 18,

  // Logistics & Engine
  ENGINE_SAFETY_DRIVE_MINS: 15,
  ENGINE_SAFETY_DIST_KM: 5,

  // Telemetry
  IOT_SYNC_INTERVAL_MS: 5000,
  
  // Triage thresholds
  URGENT_PAIN_THRESHOLD: 7,
  URGENT_WELLBEING_THRESHOLD: 7
};

export type ClinicalConfig = typeof CLINICAL_CONFIG;
