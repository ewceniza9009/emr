# Changelog

All notable changes to the Halkyone Clinical OS will be documented in this file.

## [1.1.0] - 2026-05-16

### Added
- **Forensic Audit Trail**: Added `RecordDescription` to `SecurityAuditLog` to provide context-rich record-level metadata.
- **Global Scheduling Notifications**: Implemented real-time broadcasting of appointment events (New, Changed, Deleted, Reassigned) to all practitioners and care navigators.
- **EF Core Tooling Stabilization**: Added `global.json` and local tool manifest to pin the .NET SDK to v9.0.313, resolving environment-specific runtime conflicts.
- **Audit Vault Enrichment**: Updated the dashboard's Security Audit Vault to support searching and filtering by the new forensic record descriptions.

### Fixed
- **Database Schema Sync**: Resolved `PostgresException` (column does not exist) by correcting naming conventions in the database initialization sequence.
- **Unit Test Regressions**: Fixed build errors and `NullReferenceExceptions` in `BookAppointmentCommandTests` by updating dependency injection and mocking requirements.
- **Notification Context**: Added patient and clinician names to automated scheduling alerts for improved operational awareness.

### Changed
- **Migration Strategy**: Transitioned from tactical SQL patches back to formal EF Core Migrations for schema evolution.
- **Environment Pinning**: Enforced .NET 9 SDK usage via `global.json` to prevent .NET 10 preview interference.

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
