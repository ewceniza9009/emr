# Changelog

All notable changes to the Halkyone Clinical OS will be documented in this file.

## [1.2.8] - 2026-05-18
- Implemented location-aware facility scheduling and billing architecture.
- Upgraded Facility domain entity with National Provider Identifier (NPI), Tax ID, and Place of Service Code.
- Added real-time facility binding during the clinical appointment scheduling workflow.
- Integrated active facilities dropdown menu inside the 'Facility' visit modality booking view.
- Enforced rigorous Playwright E2E automation tests confirming facility location data persistence and compatibility.

## [1.2.7] - 2026-05-18
- Implemented dynamic first-use trust binding (DFUTB) for biometric passwordless magic mobile login, eliminating manual device registrations.
- Synchronized GraphQL schema by exposing the DeviceSignature field on the PatientDto model to support seamless biometric token exchange.
- Bypassed GraphQL complexity validation limits by raising MaxFieldCost from 30,000 to 100,000 to allow high-density nested relationship projections.
- Added a premium emerald-green Primary caregiver badge featuring a custom gold Star icon to the Patient Trusted Contacts panel.
- Modernized the Triage and SDoH selection cards inside ClinicalTab with custom Lucide icons, responsive hover scales, and glowing active status beacons.
- Resolved Next.js client-side hydration warning in TelemetryPanel by eliminating illegal nested div-in-paragraph HTML markup.

## [1.2.6] - 2026-05-17
- Restored real-time IoT Telemetry and SignalR LiveHeartbeat component to the patient bio snapshot profile layout.
- Refactored the New Patient Referral intake drawer with a compact glassmorphic footer, dynamic glow accents, and high-fidelity button gradients.
- Implemented robust client-side input validation and error highlights for First Name, Last Name, Phone, and Email.
- Integrated automatic Philippine phone format masking (+63 XXX XXX XXXX) and lowercase email sanitization on intake inputs.
- Removed direct 'Add New Patient' action button from the Patient Registry to enforce the outreach-led referral lifecycle.
- Resolved GraphQL mutation schema conflicts by correcting parameter bindings and excluding non-input fields from the variable payload.

## [1.2.5] - 2026-05-17
- Modularized 915-line monolithic OutreachTab call dashboard into composed subcomponents, enhancing maintainability.
- Refactored 811-line RegistrySettings configurations monolith into high-fidelity tab-based control components.
- Eliminated duplicate inline markup by reusing high-authority UnenrollModal and DispositionModal components directly.
- Ignored compiled PWA Service Worker assets (sw.js) from source control and active development registries.
- Stabilized Guided Visit React Hooks rendering loops to respect dynamic active clinical assessments dependencies.
- Ensured type safety and robust TypeScript compilation across all modular settings and coordinator layouts.

## [1.2.4] - 2026-05-16
- Stabilized Clinical Assessment hydration by prioritizing schema-based parsing for modern questionnaires.
- Resolved 'No response recorded' display bug in historical assessment breakdowns.
- Implemented Smart Data Parser for clinical notes to improve readability of structured responses.
- Optimized the 'Guided Visit' navigation with polished, centered tactical action buttons.
- Finalized SurveyJS Neural Engine integration with high-fidelity custom rendering fallback.
- Enhanced Form Designer UX with clinical registry synchronization toasts and automatic redirection.

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
