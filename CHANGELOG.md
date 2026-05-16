# Changelog

All notable changes to the Halkyone Clinical OS will be documented in this file.

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

## [1.1.0] - 2026-05-16
- Hardened forensic audit trail with record-level context and searchable descriptions.
- Implemented global scheduling notifications for real-time team awareness.
- Stabilized infrastructure via pinned .NET 9 SDK and formal database migrations.
- Fixed critical scheduling regressions and optimized clinician travel time logic.
- Hardened Enrollment Workspace with strict Logistics Gating and contextual prerequisite checks.
- Refactored enrollment action terminology from COMMIT to ENROLL for clinical clarity.
- Resolved Npgsql database type mismatch for BiologicalSex in the outreach registry.
- Updated Playwright test suite to resolve strict-mode locator ambiguity in the enrollment flow.

## [1.0.15] - 2026-05-15
- Automated billing currency matching for different regions and timezones.
- Improved accuracy of logistical calculations across international borders.
- Enhanced regional configuration stability for global clinical nodes.

## [1.0.14] - 2026-05-15
- Improved clinic scheduling reliability and finalized identity security controls.
- Finalized the Identity Vault with Break-Glass emergency access protocols.

## [1.0.13] - 2026-05-14
- Enhanced system stability and patched high-priority security vulnerabilities.
- Resolved deployment blockers to ensure maximum uptime during updates.
