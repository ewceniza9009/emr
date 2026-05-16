# Changelog

All notable changes to the Halkyone Clinical OS will be documented in this file.

## [1.2.4] - 2026-05-16
- Stabilized Clinical Assessment hydration by prioritizing schema-based parsing for modern questionnaires.
- Resolved 'No response recorded' display bug in historical assessment breakdowns.
- Implemented Smart Data Parser for clinical notes to improve readability of structured responses.
- Optimized the 'Guided Visit' navigation with polished, centered tactical action buttons.
- Finalized SurveyJS Neural Engine integration with high-fidelity custom rendering fallback.

## [1.2.3] - 2026-05-16
- Stabilized the Clinical Form Registry by implementing direct ID-based lookups, resolving the 'FORM REGISTRY NODE NOT FOUND' error.
- Hardened questionnaire resolution logic in the Admin Designer and Guided Visit flows with global query filter bypassing.
- Ensured consistent clinical metadata hydration across administrative and practitioner-facing assessment modules.
- Resolved GraphQL filtering ambiguity in the master questionnaire registry via dedicated backend query endpoints.

## [1.2.2] - 2026-05-16
- Resolved critical Playwright CI failures by stabilizing the enrollment redirection sequence.
- Replaced hard navigations with soft routing in the Enrollment Workspace to preserve network request integrity.
- Hardened automated testing state-reset logic with dynamic status verification for outreach leads.
- Implemented resilient API response handling in the clinical test suite to prevent protocol crashes.

## [1.2.1] - 2026-05-16
- Implemented SmartPhrase support (via '/') in the Clinical Assessment SOAP notes for accelerated documentation.
- Consolidated real-time SignalR and IoT Telemetry controls into a dedicated administrative tab.
- Refactored TelemetrySimulatorService to eliminate hardcoded refresh rates and respect database-backed sync intervals.
- Elevated the Outreach & Enrollment dashboard with real-time aggregated metrics and database binding.
- Resolved scoping and compilation errors in core infrastructure telemetry simulation loops.

## [1.2.0] - 2026-05-16
- Implemented Administrative Telemetry and SignalR stream controls in the Registry Settings.
- Hardened clinical data visibility with strict Apollo Cache normalization and ID-linked data retrieval.
- Stabilized the Visit Summary engine with consolidated GraphQL queries and resilient error handling.
- Optimized the NotificationService with conditional SignalR broadcast bypass for tenant configuration.
- Purged tactical test seed data and implemented forensic cleanup for recently browsed clinical records.
- Standardized Diagnosis cache normalization via query-level aliasing to resolve ICD-10 search crashes.
- Resolved Apollo cache normalization errors for Vitals, Symptoms, and Assessment responses.
