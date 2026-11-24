CREATE SEQUENCE patient_mrn_seq START WITH 10000 INCREMENT BY 1 NO CYCLE;


CREATE TABLE "AspNetRoles" (
    "Id" text NOT NULL,
    "Name" character varying(256),
    "NormalizedName" character varying(256),
    "ConcurrencyStamp" text,
    CONSTRAINT "PK_AspNetRoles" PRIMARY KEY ("Id")
);


CREATE TABLE "AspNetUsers" (
    "Id" text NOT NULL,
    "FirstName" text NOT NULL,
    "LastName" text NOT NULL,
    "PractitionerId" uuid,
    "TenantId" uuid,
    "EmergencyAccessExpiry" timestamp with time zone,
    "UserName" character varying(256),
    "NormalizedUserName" character varying(256),
    "Email" character varying(256),
    "NormalizedEmail" character varying(256),
    "EmailConfirmed" boolean NOT NULL,
    "PasswordHash" text,
    "SecurityStamp" text,
    "ConcurrencyStamp" text,
    "PhoneNumber" text,
    "PhoneNumberConfirmed" boolean NOT NULL,
    "TwoFactorEnabled" boolean NOT NULL,
    "LockoutEnd" timestamp with time zone,
    "LockoutEnabled" boolean NOT NULL,
    "AccessFailedCount" integer NOT NULL,
    CONSTRAINT "PK_AspNetUsers" PRIMARY KEY ("Id")
);


CREATE TABLE durable_medical_equipment (
    equipment_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    serial_number character varying(100) NOT NULL,
    model_name character varying(255) NOT NULL,
    equipment_type character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    last_maintenance_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_durable_medical_equipment PRIMARY KEY (equipment_id)
);


CREATE TABLE facilities (
    facility_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    type text NOT NULL,
    facility_address_street text NOT NULL,
    facility_address_city text NOT NULL,
    facility_address_state text NOT NULL,
    facility_address_postal_code text NOT NULL,
    facility_address_region text NOT NULL,
    facility_address_country text NOT NULL,
    facility_address_latitude double precision,
    facility_address_longitude double precision,
    contact_person text,
    contact_phone text,
    contact_email text,
    npi character varying(10) NOT NULL DEFAULT '',
    tax_id character varying(20) NOT NULL DEFAULT '',
    place_of_service_code character varying(2) NOT NULL DEFAULT '',
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_facilities PRIMARY KEY (facility_id)
);


CREATE TABLE health_plans (
    health_plan_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    code text,
    description text,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_health_plans PRIMARY KEY (health_plan_id)
);


CREATE TABLE integration_profiles (
    integration_profile_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    partner text NOT NULL,
    api_key text NOT NULL,
    base_url text,
    webhook_secret text,
    last_sync_at timestamp with time zone,
    is_active boolean NOT NULL,
    settings_json jsonb,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_integration_profiles PRIMARY KEY (integration_profile_id)
);


CREATE TABLE medications (
    medication_id uuid NOT NULL,
    name text NOT NULL,
    strength text NOT NULL,
    default_route integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_medications PRIMARY KEY (medication_id)
);


CREATE TABLE notifications (
    notification_id uuid NOT NULL,
    user_id text,
    title text NOT NULL,
    message text NOT NULL,
    priority integer NOT NULL,
    is_read boolean NOT NULL,
    read_at timestamp with time zone,
    action_url text,
    icon text,
    category text,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_notifications PRIMARY KEY (notification_id)
);


CREATE TABLE outbox_messages (
    id uuid NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    created_on_utc timestamp with time zone NOT NULL,
    processed_on_utc timestamp with time zone,
    error text,
    retry_count integer NOT NULL,
    next_attempt_utc timestamp with time zone,
    CONSTRAINT pk_outbox_messages PRIMARY KEY (id)
);


CREATE TABLE outreach_scripts (
    outreach_script_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    location_name text NOT NULL,
    postal_code text NOT NULL,
    script_title text NOT NULL,
    content text NOT NULL,
    is_default boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_outreach_scripts PRIMARY KEY (outreach_script_id)
);


CREATE TABLE practitioners (
    practitioner_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    prc_license_number character varying(50),
    npi_number character varying(50),
    is_active boolean NOT NULL DEFAULT TRUE,
    position text NOT NULL,
    is_care_navigator boolean NOT NULL DEFAULT FALSE,
    is_supporting_clinician boolean NOT NULL DEFAULT FALSE,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_practitioners PRIMARY KEY (practitioner_id)
);


CREATE TABLE questionnaires (
    questionnaire_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    assessment_type integer NOT NULL,
    schema_json text,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_questionnaires PRIMARY KEY (questionnaire_id)
);


CREATE TABLE security_audit_logs (
    security_audit_log_id uuid NOT NULL,
    action text NOT NULL,
    actor_user_id text NOT NULL,
    actor_name text NOT NULL,
    target_user_id text,
    target_name text,
    details text,
    record_description text,
    ip_address text,
    user_agent text,
    tenant_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_security_audit_logs PRIMARY KEY (security_audit_log_id)
);


CREATE TABLE smart_phrases (
    phrase_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    shortcut text NOT NULL,
    label text NOT NULL,
    template_text text NOT NULL,
    category text NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_smart_phrases PRIMARY KEY (phrase_id)
);


CREATE TABLE tenant_configurations (
    tenant_configuration_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    organization_name text NOT NULL,
    currency text NOT NULL,
    timezone text NOT NULL,
    language text NOT NULL,
    date_format text NOT NULL,
    am_start_hour integer NOT NULL,
    pm_start_hour integer NOT NULL,
    day_end_hour integer NOT NULL,
    engine_safety_drive_mins integer NOT NULL,
    engine_safety_dist_km double precision NOT NULL,
    enable_telemetry boolean NOT NULL,
    enable_signal_r boolean NOT NULL,
    telemetry_delay_seconds integer NOT NULL,
    iot_sync_interval_ms integer NOT NULL,
    urgent_pain_threshold integer NOT NULL,
    urgent_wellbeing_threshold integer NOT NULL,
    is_active boolean NOT NULL,
    enable_elasticsearch boolean NOT NULL,
    enable_osrm_travel boolean NOT NULL,
    enforce_mfa boolean NOT NULL,
    session_timeout_minutes integer NOT NULL,
    strict_onboarding boolean NOT NULL,
    contact_email text,
    extended_settings_json text,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_tenant_configurations PRIMARY KEY (tenant_configuration_id)
);


CREATE TABLE "AspNetRoleClaims" (
    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
    "RoleId" text NOT NULL,
    "ClaimType" text,
    "ClaimValue" text,
    CONSTRAINT "PK_AspNetRoleClaims" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE
);


CREATE TABLE "AspNetUserClaims" (
    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
    "UserId" text NOT NULL,
    "ClaimType" text,
    "ClaimValue" text,
    CONSTRAINT "PK_AspNetUserClaims" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);


CREATE TABLE "AspNetUserLogins" (
    "LoginProvider" text NOT NULL,
    "ProviderKey" text NOT NULL,
    "ProviderDisplayName" text,
    "UserId" text NOT NULL,
    CONSTRAINT "PK_AspNetUserLogins" PRIMARY KEY ("LoginProvider", "ProviderKey"),
    CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);


CREATE TABLE "AspNetUserRoles" (
    "UserId" text NOT NULL,
    "RoleId" text NOT NULL,
    CONSTRAINT "PK_AspNetUserRoles" PRIMARY KEY ("UserId", "RoleId"),
    CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);


CREATE TABLE "AspNetUserTokens" (
    "UserId" text NOT NULL,
    "LoginProvider" text NOT NULL,
    "Name" text NOT NULL,
    "Value" text,
    CONSTRAINT "PK_AspNetUserTokens" PRIMARY KEY ("UserId", "LoginProvider", "Name"),
    CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);


CREATE TABLE telemetry_logs (
    log_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    equipment_id uuid NOT NULL,
    sensor_type character varying(100) NOT NULL,
    sensor_value numeric(12,4) NOT NULL,
    unit character varying(20) NOT NULL,
    recorded_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_telemetry_logs PRIMARY KEY (log_id),
    CONSTRAINT fk_telemetry_logs_durable_medical_equipment_equipment_id FOREIGN KEY (equipment_id) REFERENCES durable_medical_equipment (equipment_id) ON DELETE CASCADE
);


CREATE TABLE patients (
    patient_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    external_id text,
    mrn character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    dob timestamp with time zone NOT NULL,
    biological_sex integer NOT NULL,
    gender_identity character varying(50),
    philhealth_number character varying(50),
    civil_status text,
    religion text,
    occupation text,
    place_of_birth text,
    nationality text,
    language text,
    triage_note text,
    is_active boolean NOT NULL,
    device_signature text,
    health_plan_id uuid,
    facility_id uuid,
    communication_status integer,
    tech_access integer,
    barriers_to_care text,
    consent_to_treat boolean NOT NULL,
    consent_hipaa boolean NOT NULL,
    consent_marketing boolean NOT NULL,
    interpreter_required boolean NOT NULL,
    preferred_contact_method text,
    has_poa boolean NOT NULL,
    has_advance_directive boolean NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_patients PRIMARY KEY (patient_id),
    CONSTRAINT fk_patients_facilities_facility_id FOREIGN KEY (facility_id) REFERENCES facilities (facility_id),
    CONSTRAINT fk_patients_health_plans_health_plan_id FOREIGN KEY (health_plan_id) REFERENCES health_plans (health_plan_id)
);


CREATE TABLE practitioner_licensures (
    licensure_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    practitioner_id uuid NOT NULL,
    license_number character varying(100) NOT NULL,
    state character varying(50) NOT NULL,
    expiry_date timestamp with time zone NOT NULL,
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_practitioner_licensures PRIMARY KEY (licensure_id),
    CONSTRAINT fk_practitioner_licensures_practitioners_practitioner_id FOREIGN KEY (practitioner_id) REFERENCES practitioners (practitioner_id) ON DELETE CASCADE
);


CREATE TABLE practitioner_service_areas (
    service_area_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    practitioner_id uuid NOT NULL,
    zip_code character varying(20) NOT NULL,
    county character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_practitioner_service_areas PRIMARY KEY (service_area_id),
    CONSTRAINT fk_practitioner_service_areas_practitioners_practitioner_id FOREIGN KEY (practitioner_id) REFERENCES practitioners (practitioner_id) ON DELETE CASCADE
);


CREATE TABLE provider_shifts (
    provider_shift_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    practitioner_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time interval NOT NULL,
    end_time interval NOT NULL,
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_provider_shifts PRIMARY KEY (provider_shift_id),
    CONSTRAINT fk_provider_shifts_practitioners_practitioner_id FOREIGN KEY (practitioner_id) REFERENCES practitioners (practitioner_id) ON DELETE CASCADE
);


CREATE TABLE schedule_blocks (
    block_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    practitioner_id uuid NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_schedule_blocks PRIMARY KEY (block_id),
    CONSTRAINT fk_schedule_blocks_practitioners_practitioner_id FOREIGN KEY (practitioner_id) REFERENCES practitioners (practitioner_id) ON DELETE RESTRICT
);


CREATE TABLE questions (
    question_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    questionnaire_id uuid NOT NULL,
    text text NOT NULL,
    subtext text,
    type integer NOT NULL,
    "order" integer NOT NULL,
    options_json text,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_questions PRIMARY KEY (question_id),
    CONSTRAINT fk_questions__questionnaires_questionnaire_id FOREIGN KEY (questionnaire_id) REFERENCES questionnaires (questionnaire_id) ON DELETE CASCADE
);


CREATE TABLE advance_directives (
    advance_directive_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    type integer NOT NULL,
    document_url text,
    effective_date timestamp with time zone NOT NULL,
    is_active boolean NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_advance_directives PRIMARY KEY (advance_directive_id),
    CONSTRAINT fk_advance_directives_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE allergies (
    allergy_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    allergen character varying(100) NOT NULL,
    severity character varying(50) NOT NULL,
    reaction character varying(255) NOT NULL,
    identified_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_allergies PRIMARY KEY (allergy_id),
    CONSTRAINT fk_allergies_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE appointments (
    appointment_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    visit_type character varying(100) NOT NULL,
    status integer NOT NULL,
    scheduled_start timestamp with time zone NOT NULL,
    scheduled_end timestamp with time zone NOT NULL,
    modality text NOT NULL,
    meeting_link character varying(255),
    practitioner_id uuid,
    travel_time_minutes double precision,
    distance_in_miles double precision,
    facility_id uuid,
    planned_assessments integer[] NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_appointments PRIMARY KEY (appointment_id),
    CONSTRAINT fk_appointments_facilities_facility_id FOREIGN KEY (facility_id) REFERENCES facilities (facility_id) ON DELETE RESTRICT,
    CONSTRAINT fk_appointments_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointments_practitioners_practitioner_id FOREIGN KEY (practitioner_id) REFERENCES practitioners (practitioner_id) ON DELETE RESTRICT
);


CREATE TABLE care_navigation_cases (
    case_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    navigator_id uuid NOT NULL,
    acuity_level character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    opened_at timestamp with time zone NOT NULL,
    closed_at timestamp with time zone,
    resolution_notes text,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_care_navigation_cases PRIMARY KEY (case_id),
    CONSTRAINT fk_care_navigation_cases_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_care_navigation_cases_practitioners_navigator_id FOREIGN KEY (navigator_id) REFERENCES practitioners (practitioner_id) ON DELETE RESTRICT
);


CREATE TABLE care_threads (
    care_thread_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    subject text NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_care_threads PRIMARY KEY (care_thread_id),
    CONSTRAINT fk_care_threads_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE entity_addresses (
    entity_address_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid,
    practitioner_id uuid,
    street text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    region text NOT NULL,
    country text NOT NULL,
    latitude double precision,
    longitude double precision,
    type text NOT NULL,
    is_primary boolean NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_entity_addresses PRIMARY KEY (entity_address_id),
    CONSTRAINT fk_entity_addresses_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_entity_addresses_practitioners_practitioner_id FOREIGN KEY (practitioner_id) REFERENCES practitioners (practitioner_id) ON DELETE CASCADE
);


CREATE TABLE magic_tokens (
    magic_token_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    token_value text NOT NULL,
    token_hash text NOT NULL,
    device_id text NOT NULL,
    is_caregiver boolean NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_used boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_magic_tokens PRIMARY KEY (magic_token_id),
    CONSTRAINT fk_magic_tokens_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE patient_accounts (
    patient_account_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_active boolean NOT NULL DEFAULT TRUE,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_patient_accounts PRIMARY KEY (patient_account_id),
    CONSTRAINT fk_patient_accounts_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE patient_contacts (
    contact_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    relationship character varying(50) NOT NULL,
    phone_number character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    is_primary_contact boolean NOT NULL DEFAULT FALSE,
    has_power_of_attorney boolean NOT NULL DEFAULT FALSE,
    is_legal_guardian boolean NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_patient_contacts PRIMARY KEY (contact_id),
    CONSTRAINT fk_patient_contacts_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE patient_emails (
    email_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    email_address character varying(255) NOT NULL,
    email_type character varying(50) NOT NULL,
    is_primary boolean NOT NULL DEFAULT FALSE,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_patient_emails PRIMARY KEY (email_id),
    CONSTRAINT fk_patient_emails_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE patient_outreaches (
    patient_outreach_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    mailing_address_street text NOT NULL,
    mailing_address_city text NOT NULL,
    mailing_address_state text NOT NULL,
    mailing_address_postal_code text NOT NULL,
    mailing_address_region text NOT NULL,
    mailing_address_country text NOT NULL,
    mailing_address_latitude double precision,
    mailing_address_longitude double precision,
    referral_source text,
    primary_phone character varying(50),
    primary_email text,
    status text NOT NULL,
    next_follow_up_date timestamp with time zone,
    is_accepted boolean NOT NULL,
    orientation_date timestamp with time zone,
    selected_modality integer,
    health_plan_id uuid,
    communication_status integer,
    tech_access integer,
    disposition integer NOT NULL,
    barriers_to_care text,
    notes text,
    date_of_birth timestamp with time zone,
    biological_sex integer,
    gender_identity character varying(50),
    language text,
    civil_status text,
    last_activity_date timestamp with time zone,
    call_attempt_count integer NOT NULL,
    is_do_not_call boolean NOT NULL,
    is_opted_out boolean NOT NULL,
    latest_activity_outcome text,
    latest_activity_reason text,
    preferred_contact_time text,
    assigned_practitioner_id uuid,
    enrolled_patient_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_patient_outreaches PRIMARY KEY (patient_outreach_id),
    CONSTRAINT fk_patient_outreaches_health_plans_health_plan_id FOREIGN KEY (health_plan_id) REFERENCES health_plans (health_plan_id),
    CONSTRAINT fk_patient_outreaches_patients_enrolled_patient_id FOREIGN KEY (enrolled_patient_id) REFERENCES patients (patient_id),
    CONSTRAINT fk_patient_outreaches_practitioners_assigned_practitioner_id FOREIGN KEY (assigned_practitioner_id) REFERENCES practitioners (practitioner_id)
);


CREATE TABLE patient_phones (
    phone_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    phone_number character varying(50) NOT NULL,
    phone_type character varying(50) NOT NULL,
    is_primary boolean NOT NULL DEFAULT FALSE,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_patient_phones PRIMARY KEY (phone_id),
    CONSTRAINT fk_patient_phones_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE prescriptions (
    prescription_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    medication_id uuid NOT NULL,
    prescribed_by_id uuid NOT NULL,
    dose text NOT NULL,
    frequency text NOT NULL,
    route integer NOT NULL,
    indications text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    is_active boolean NOT NULL,
    signature_hash text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_prescriptions PRIMARY KEY (prescription_id),
    CONSTRAINT fk_prescriptions_medications_medication_id FOREIGN KEY (medication_id) REFERENCES medications (medication_id) ON DELETE CASCADE,
    CONSTRAINT fk_prescriptions_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_prescriptions_practitioners_prescribed_by_id FOREIGN KEY (prescribed_by_id) REFERENCES practitioners (practitioner_id) ON DELETE CASCADE
);


CREATE TABLE z_benefit_claims (
    claim_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    philhealth_number character varying(50) NOT NULL,
    package_code character varying(50) NOT NULL,
    status character varying(50) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    submitted_at timestamp with time zone,
    approved_at timestamp with time zone,
    paid_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_z_benefit_claims PRIMARY KEY (claim_id),
    CONSTRAINT fk_z_benefit_claims_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE RESTRICT
);


CREATE TABLE appointment_resources (
    appointment_id uuid NOT NULL,
    block_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_appointment_resources PRIMARY KEY (appointment_id, block_id),
    CONSTRAINT fk_appointment_resources_appointments_appointment_id FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id) ON DELETE CASCADE,
    CONSTRAINT fk_appointment_resources_schedule_blocks_block_id FOREIGN KEY (block_id) REFERENCES schedule_blocks (block_id) ON DELETE CASCADE
);


CREATE TABLE appointment_supporting_clinicians (
    appointment_id uuid NOT NULL,
    practitioner_id uuid NOT NULL,
    CONSTRAINT pk_appointment_supporting_clinicians PRIMARY KEY (appointment_id, practitioner_id),
    CONSTRAINT "fk_appointment_supporting_clinicians_appointments_appointment_~" FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id) ON DELETE CASCADE,
    CONSTRAINT "fk_appointment_supporting_clinicians_practitioners_practitione~" FOREIGN KEY (practitioner_id) REFERENCES practitioners (practitioner_id) ON DELETE CASCADE
);


CREATE TABLE clinical_encounters (
    encounter_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    practitioner_id uuid NOT NULL,
    appointment_id uuid,
    type integer NOT NULL,
    status character varying(50) NOT NULL,
    pps_score integer,
    encounter_date timestamp with time zone NOT NULL,
    admitted_at timestamp with time zone,
    discharged_at timestamp with time zone,
    chief_complaint character varying(1000) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_clinical_encounters PRIMARY KEY (encounter_id),
    CONSTRAINT fk_clinical_encounters_appointments_appointment_id FOREIGN KEY (appointment_id) REFERENCES appointments (appointment_id) ON DELETE SET NULL,
    CONSTRAINT fk_clinical_encounters_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_clinical_encounters_practitioners_practitioner_id FOREIGN KEY (practitioner_id) REFERENCES practitioners (practitioner_id) ON DELETE RESTRICT
);


CREATE TABLE barrier_logs (
    barrier_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    case_id uuid NOT NULL,
    barrier_category character varying(100) NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_barrier_logs PRIMARY KEY (barrier_id),
    CONSTRAINT fk_barrier_logs_care_navigation_cases_case_id FOREIGN KEY (case_id) REFERENCES care_navigation_cases (case_id) ON DELETE CASCADE
);


CREATE TABLE intervention_logs (
    intervention_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    case_id uuid NOT NULL,
    action_taken text NOT NULL,
    logged_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_intervention_logs PRIMARY KEY (intervention_id),
    CONSTRAINT fk_intervention_logs_care_navigation_cases_case_id FOREIGN KEY (case_id) REFERENCES care_navigation_cases (case_id) ON DELETE CASCADE
);


CREATE TABLE navigation_tasks (
    task_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    case_id uuid NOT NULL,
    assigned_to uuid NOT NULL,
    description text NOT NULL,
    due_date timestamp with time zone NOT NULL,
    status character varying(50) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_navigation_tasks PRIMARY KEY (task_id),
    CONSTRAINT fk_navigation_tasks_care_navigation_cases_case_id FOREIGN KEY (case_id) REFERENCES care_navigation_cases (case_id) ON DELETE CASCADE,
    CONSTRAINT fk_navigation_tasks_practitioners_assigned_to FOREIGN KEY (assigned_to) REFERENCES practitioners (practitioner_id) ON DELETE RESTRICT
);


CREATE TABLE sdoh_assessments (
    sdoh_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    case_id uuid NOT NULL,
    assessor_id uuid NOT NULL,
    food_insecurity boolean NOT NULL DEFAULT FALSE,
    housing_instability boolean NOT NULL DEFAULT FALSE,
    transportation_barrier boolean NOT NULL DEFAULT FALSE,
    financial_toxicity boolean NOT NULL DEFAULT FALSE,
    assessed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_sdoh_assessments PRIMARY KEY (sdoh_id),
    CONSTRAINT fk_sdoh_assessments_care_navigation_cases_case_id FOREIGN KEY (case_id) REFERENCES care_navigation_cases (case_id) ON DELETE CASCADE,
    CONSTRAINT fk_sdoh_assessments_practitioners_assessor_id FOREIGN KEY (assessor_id) REFERENCES practitioners (practitioner_id) ON DELETE RESTRICT
);


CREATE TABLE chat_messages (
    chat_message_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    care_thread_id uuid NOT NULL,
    sender_role text NOT NULL,
    content text NOT NULL,
    timestamp timestamp with time zone NOT NULL,
    is_attachment boolean NOT NULL,
    is_seen boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_chat_messages PRIMARY KEY (chat_message_id),
    CONSTRAINT fk_chat_messages_care_threads_care_thread_id FOREIGN KEY (care_thread_id) REFERENCES care_threads (care_thread_id) ON DELETE CASCADE
);


CREATE TABLE caregiver_links (
    caregiver_link_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_account_id uuid NOT NULL,
    caregiver_user_id uuid,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    relationship character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(50) NOT NULL,
    is_primary boolean NOT NULL DEFAULT FALSE,
    access_granted boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_caregiver_links PRIMARY KEY (caregiver_link_id),
    CONSTRAINT fk_caregiver_links_patient_accounts_patient_account_id FOREIGN KEY (patient_account_id) REFERENCES patient_accounts (patient_account_id) ON DELETE CASCADE
);


CREATE TABLE patient_documents (
    patient_document_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    patient_contact_id uuid,
    title text NOT NULL,
    document_type text NOT NULL,
    storage_url text NOT NULL,
    content_type text,
    file_size bigint NOT NULL,
    uploaded_at timestamp with time zone NOT NULL,
    uploaded_by_id uuid,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_patient_documents PRIMARY KEY (patient_document_id),
    CONSTRAINT fk_patient_documents_patient_contacts_patient_contact_id FOREIGN KEY (patient_contact_id) REFERENCES patient_contacts (contact_id),
    CONSTRAINT fk_patient_documents_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_documents_practitioners_uploaded_by_id FOREIGN KEY (uploaded_by_id) REFERENCES practitioners (practitioner_id)
);


CREATE TABLE outreach_activities (
    outreach_activity_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    outreach_id uuid NOT NULL,
    practitioner_id uuid NOT NULL,
    method integer NOT NULL,
    outcome text,
    reason text,
    notes text,
    activity_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_outreach_activities PRIMARY KEY (outreach_activity_id),
    CONSTRAINT fk_outreach_activities_patient_outreaches_outreach_id FOREIGN KEY (outreach_id) REFERENCES patient_outreaches (patient_outreach_id) ON DELETE CASCADE,
    CONSTRAINT fk_outreach_activities_practitioners_practitioner_id FOREIGN KEY (practitioner_id) REFERENCES practitioners (practitioner_id) ON DELETE CASCADE
);


CREATE TABLE outreach_contacts (
    outreach_contact_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_outreach_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    relationship integer NOT NULL,
    phone_number text,
    email text,
    is_primary_contact boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_outreach_contacts PRIMARY KEY (outreach_contact_id),
    CONSTRAINT fk_outreach_contacts_patient_outreaches_patient_outreach_id FOREIGN KEY (patient_outreach_id) REFERENCES patient_outreaches (patient_outreach_id) ON DELETE CASCADE
);


CREATE TABLE claim_status_logs (
    log_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    claim_id uuid NOT NULL,
    previous_status character varying(50) NOT NULL,
    new_status character varying(50) NOT NULL,
    changed_by character varying(100) NOT NULL,
    remarks text,
    changed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_claim_status_logs PRIMARY KEY (log_id),
    CONSTRAINT fk_claim_status_logs_z_benefit_claims_claim_id FOREIGN KEY (claim_id) REFERENCES z_benefit_claims (claim_id) ON DELETE CASCADE
);


CREATE TABLE assessment_responses (
    assessment_response_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    questionnaire_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    encounter_id uuid,
    assessor_id uuid NOT NULL,
    completed_at timestamp with time zone NOT NULL,
    answers_json text NOT NULL,
    total_score numeric,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_assessment_responses PRIMARY KEY (assessment_response_id),
    CONSTRAINT fk_assessment_responses__questionnaires_questionnaire_id FOREIGN KEY (questionnaire_id) REFERENCES questionnaires (questionnaire_id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_responses_clinical_encounters_encounter_id FOREIGN KEY (encounter_id) REFERENCES clinical_encounters (encounter_id),
    CONSTRAINT fk_assessment_responses_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_responses_practitioners_assessor_id FOREIGN KEY (assessor_id) REFERENCES practitioners (practitioner_id) ON DELETE CASCADE
);


CREATE TABLE billing_invoices (
    invoice_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    encounter_id uuid,
    claim_id uuid,
    invoice_number character varying(100) NOT NULL,
    status character varying(50) NOT NULL,
    subtotal_amount numeric(12,2) NOT NULL,
    covered_amount numeric(12,2) NOT NULL,
    patient_responsibility numeric(12,2) NOT NULL,
    generated_at timestamp with time zone NOT NULL,
    due_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_billing_invoices PRIMARY KEY (invoice_id),
    CONSTRAINT fk_billing_invoices_clinical_encounters_encounter_id FOREIGN KEY (encounter_id) REFERENCES clinical_encounters (encounter_id),
    CONSTRAINT fk_billing_invoices_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_billing_invoices_z_benefit_claims_claim_id FOREIGN KEY (claim_id) REFERENCES z_benefit_claims (claim_id) ON DELETE SET NULL
);


CREATE TABLE clinical_notes (
    note_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    encounter_id uuid NOT NULL,
    author_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    subjective text,
    objective text,
    assessment text,
    plan text,
    content text NOT NULL,
    is_signed boolean NOT NULL DEFAULT FALSE,
    signature_hash text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_clinical_notes PRIMARY KEY (note_id),
    CONSTRAINT fk_clinical_notes_clinical_encounters_encounter_id FOREIGN KEY (encounter_id) REFERENCES clinical_encounters (encounter_id) ON DELETE CASCADE,
    CONSTRAINT fk_clinical_notes_practitioners_author_id FOREIGN KEY (author_id) REFERENCES practitioners (practitioner_id) ON DELETE RESTRICT
);


CREATE TABLE diagnoses (
    diagnosis_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    encounter_id uuid,
    icd10_code character varying(20) NOT NULL,
    description text NOT NULL,
    is_primary boolean NOT NULL DEFAULT FALSE,
    diagnosed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_diagnoses PRIMARY KEY (diagnosis_id),
    CONSTRAINT fk_diagnoses_clinical_encounters_encounter_id FOREIGN KEY (encounter_id) REFERENCES clinical_encounters (encounter_id) ON DELETE SET NULL,
    CONSTRAINT fk_diagnoses_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE equipment_deliveries (
    delivery_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    equipment_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    encounter_id uuid,
    status character varying(50) NOT NULL,
    requested_at timestamp with time zone NOT NULL,
    delivered_at timestamp with time zone,
    delivery_address text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_equipment_deliveries PRIMARY KEY (delivery_id),
    CONSTRAINT fk_equipment_deliveries_clinical_encounters_encounter_id FOREIGN KEY (encounter_id) REFERENCES clinical_encounters (encounter_id) ON DELETE SET NULL,
    CONSTRAINT fk_equipment_deliveries_durable_medical_equipment_equipment_id FOREIGN KEY (equipment_id) REFERENCES durable_medical_equipment (equipment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_deliveries_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE RESTRICT
);


CREATE TABLE esas_assessments (
    assessment_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    encounter_id uuid,
    pain integer NOT NULL,
    tiredness integer NOT NULL,
    drowsiness integer NOT NULL,
    nausea integer NOT NULL,
    lack_of_appetite integer NOT NULL,
    shortness_of_breath integer NOT NULL,
    depression integer NOT NULL,
    anxiety integer NOT NULL,
    wellbeing integer NOT NULL,
    assessed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_esas_assessments PRIMARY KEY (assessment_id),
    CONSTRAINT fk_esas_assessments_clinical_encounters_encounter_id FOREIGN KEY (encounter_id) REFERENCES clinical_encounters (encounter_id) ON DELETE SET NULL,
    CONSTRAINT fk_esas_assessments_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE spiritual_assessments (
    spiritual_assessment_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    encounter_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    faith text,
    importance text,
    community text,
    address_in_care text,
    religious_preference text,
    clergy_contact text,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_spiritual_assessments PRIMARY KEY (spiritual_assessment_id),
    CONSTRAINT fk_spiritual_assessments_clinical_encounters_encounter_id FOREIGN KEY (encounter_id) REFERENCES clinical_encounters (encounter_id) ON DELETE CASCADE,
    CONSTRAINT fk_spiritual_assessments_patients_patient_id FOREIGN KEY (patient_id) REFERENCES patients (patient_id) ON DELETE CASCADE
);


CREATE TABLE vital_signs (
    vital_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    encounter_id uuid NOT NULL,
    heart_rate numeric(5,2),
    blood_pressure_systolic numeric(5,2),
    blood_pressure_diastolic numeric(5,2),
    respiratory_rate numeric(5,2),
    temperature numeric(5,2),
    oxygen_saturation numeric(5,2),
    weight numeric(5,2),
    recorded_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_vital_signs PRIMARY KEY (vital_id),
    CONSTRAINT fk_vital_signs_clinical_encounters_encounter_id FOREIGN KEY (encounter_id) REFERENCES clinical_encounters (encounter_id) ON DELETE CASCADE
);


CREATE TABLE billing_invoice_items (
    item_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    description character varying(500) NOT NULL,
    quantity numeric(12,2) NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by text,
    updated_at timestamp with time zone,
    updated_by text,
    is_deleted boolean NOT NULL,
    CONSTRAINT pk_billing_invoice_items PRIMARY KEY (item_id),
    CONSTRAINT fk_billing_invoice_items_billing_invoices_invoice_id FOREIGN KEY (invoice_id) REFERENCES billing_invoices (invoice_id) ON DELETE CASCADE
);


CREATE INDEX ix_advance_directives_patient_id ON advance_directives (patient_id);


CREATE INDEX "IX_advance_directives_tenant_id" ON advance_directives (tenant_id);


CREATE INDEX ix_allergies_patient_id ON allergies (patient_id);


CREATE INDEX "IX_allergies_tenant_id" ON allergies (tenant_id);


CREATE INDEX ix_appointment_resources_block_id ON appointment_resources (block_id);


CREATE INDEX "IX_appointment_resources_tenant_id" ON appointment_resources (tenant_id);


CREATE INDEX ix_appointment_supporting_clinicians_practitioner_id ON appointment_supporting_clinicians (practitioner_id);


CREATE INDEX ix_appointments_facility_id ON appointments (facility_id);


CREATE INDEX ix_appointments_patient_id ON appointments (patient_id);


CREATE INDEX ix_appointments_practitioner_id ON appointments (practitioner_id);


CREATE INDEX "IX_appointments_tenant_id" ON appointments (tenant_id);


CREATE INDEX "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims" ("RoleId");


CREATE UNIQUE INDEX "RoleNameIndex" ON "AspNetRoles" ("NormalizedName");


CREATE INDEX "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims" ("UserId");


CREATE INDEX "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins" ("UserId");


CREATE INDEX "IX_AspNetUserRoles_RoleId" ON "AspNetUserRoles" ("RoleId");


CREATE INDEX "EmailIndex" ON "AspNetUsers" ("NormalizedEmail");


CREATE UNIQUE INDEX "UserNameIndex" ON "AspNetUsers" ("NormalizedUserName");


CREATE INDEX ix_assessment_responses_assessor_id ON assessment_responses (assessor_id);


CREATE INDEX ix_assessment_responses_encounter_id ON assessment_responses (encounter_id);


CREATE INDEX ix_assessment_responses_patient_id ON assessment_responses (patient_id);


CREATE INDEX ix_assessment_responses_questionnaire_id ON assessment_responses (questionnaire_id);


CREATE INDEX "IX_assessment_responses_tenant_id" ON assessment_responses (tenant_id);


CREATE INDEX ix_barrier_logs_case_id ON barrier_logs (case_id);


CREATE INDEX "IX_barrier_logs_tenant_id" ON barrier_logs (tenant_id);


CREATE INDEX ix_billing_invoice_items_invoice_id ON billing_invoice_items (invoice_id);


CREATE INDEX "IX_billing_invoice_items_tenant_id" ON billing_invoice_items (tenant_id);


CREATE INDEX ix_billing_invoices_claim_id ON billing_invoices (claim_id);


CREATE INDEX ix_billing_invoices_encounter_id ON billing_invoices (encounter_id);


CREATE INDEX ix_billing_invoices_patient_id ON billing_invoices (patient_id);


CREATE INDEX "IX_billing_invoices_tenant_id" ON billing_invoices (tenant_id);


CREATE UNIQUE INDEX ix_billing_invoices_tenant_invoice_number ON billing_invoices (tenant_id, invoice_number) WHERE is_deleted = false;


CREATE INDEX ix_care_navigation_cases_navigator_id ON care_navigation_cases (navigator_id);


CREATE INDEX ix_care_navigation_cases_patient_id ON care_navigation_cases (patient_id);


CREATE INDEX "IX_care_navigation_cases_tenant_id" ON care_navigation_cases (tenant_id);


CREATE INDEX ix_care_threads_patient_id ON care_threads (patient_id);


CREATE INDEX "IX_care_threads_tenant_id" ON care_threads (tenant_id);


CREATE INDEX ix_caregiver_links_patient_account_id ON caregiver_links (patient_account_id);


CREATE INDEX "IX_caregiver_links_tenant_id" ON caregiver_links (tenant_id);


CREATE INDEX ix_chat_messages_care_thread_id ON chat_messages (care_thread_id);


CREATE INDEX "IX_chat_messages_tenant_id" ON chat_messages (tenant_id);


CREATE INDEX ix_claim_status_logs_claim_id ON claim_status_logs (claim_id);


CREATE INDEX "IX_claim_status_logs_tenant_id" ON claim_status_logs (tenant_id);


CREATE INDEX ix_clinical_encounters_appointment_id ON clinical_encounters (appointment_id);


CREATE INDEX ix_clinical_encounters_patient_id ON clinical_encounters (patient_id);


CREATE INDEX ix_clinical_encounters_practitioner_id ON clinical_encounters (practitioner_id);


CREATE INDEX "IX_clinical_encounters_tenant_id" ON clinical_encounters (tenant_id);


CREATE INDEX ix_clinical_notes_author_id ON clinical_notes (author_id);


CREATE INDEX ix_clinical_notes_encounter_id ON clinical_notes (encounter_id);


CREATE INDEX "IX_clinical_notes_tenant_id" ON clinical_notes (tenant_id);


CREATE INDEX ix_diagnoses_encounter_id ON diagnoses (encounter_id);


CREATE INDEX ix_diagnoses_patient_id ON diagnoses (patient_id);


CREATE INDEX "IX_diagnoses_tenant_id" ON diagnoses (tenant_id);


CREATE UNIQUE INDEX ix_dme_tenant_serial_number ON durable_medical_equipment (tenant_id, serial_number) WHERE is_deleted = false;


CREATE INDEX "IX_durable_medical_equipment_tenant_id" ON durable_medical_equipment (tenant_id);


CREATE INDEX ix_entity_addresses_patient_id ON entity_addresses (patient_id);


CREATE INDEX ix_entity_addresses_practitioner_id ON entity_addresses (practitioner_id);


CREATE INDEX "IX_entity_addresses_tenant_id" ON entity_addresses (tenant_id);


CREATE INDEX ix_equipment_deliveries_encounter_id ON equipment_deliveries (encounter_id);


CREATE INDEX ix_equipment_deliveries_equipment_id ON equipment_deliveries (equipment_id);


CREATE INDEX ix_equipment_deliveries_patient_id ON equipment_deliveries (patient_id);


CREATE INDEX "IX_equipment_deliveries_tenant_id" ON equipment_deliveries (tenant_id);


CREATE INDEX ix_esas_assessments_encounter_id ON esas_assessments (encounter_id);


CREATE INDEX ix_esas_assessments_patient_id ON esas_assessments (patient_id);


CREATE INDEX "IX_esas_assessments_tenant_id" ON esas_assessments (tenant_id);


CREATE INDEX "IX_facilities_tenant_id" ON facilities (tenant_id);


CREATE INDEX "IX_health_plans_tenant_id" ON health_plans (tenant_id);


CREATE INDEX "IX_integration_profiles_tenant_id" ON integration_profiles (tenant_id);


CREATE INDEX ix_intervention_logs_case_id ON intervention_logs (case_id);


CREATE INDEX "IX_intervention_logs_tenant_id" ON intervention_logs (tenant_id);


CREATE INDEX ix_magic_tokens_patient_id ON magic_tokens (patient_id);


CREATE INDEX "IX_magic_tokens_tenant_id" ON magic_tokens (tenant_id);


CREATE INDEX ix_navigation_tasks_assigned_to ON navigation_tasks (assigned_to);


CREATE INDEX ix_navigation_tasks_case_id ON navigation_tasks (case_id);


CREATE INDEX "IX_navigation_tasks_tenant_id" ON navigation_tasks (tenant_id);


CREATE INDEX ix_outreach_activities_outreach_id ON outreach_activities (outreach_id);


CREATE INDEX ix_outreach_activities_practitioner_id ON outreach_activities (practitioner_id);


CREATE INDEX "IX_outreach_activities_tenant_id" ON outreach_activities (tenant_id);


CREATE INDEX ix_outreach_contacts_patient_outreach_id ON outreach_contacts (patient_outreach_id);


CREATE INDEX "IX_outreach_contacts_tenant_id" ON outreach_contacts (tenant_id);


CREATE INDEX "IX_outreach_scripts_tenant_id" ON outreach_scripts (tenant_id);


CREATE UNIQUE INDEX ix_patient_accounts_patient_id ON patient_accounts (patient_id);


CREATE INDEX "IX_patient_accounts_tenant_id" ON patient_accounts (tenant_id);


CREATE INDEX ix_patient_contacts_patient_id ON patient_contacts (patient_id);


CREATE INDEX "IX_patient_contacts_tenant_id" ON patient_contacts (tenant_id);


CREATE INDEX ix_patient_documents_patient_contact_id ON patient_documents (patient_contact_id);


CREATE INDEX ix_patient_documents_patient_id ON patient_documents (patient_id);


CREATE INDEX "IX_patient_documents_tenant_id" ON patient_documents (tenant_id);


CREATE INDEX ix_patient_documents_uploaded_by_id ON patient_documents (uploaded_by_id);


CREATE INDEX ix_patient_emails_patient_id ON patient_emails (patient_id);


CREATE INDEX "IX_patient_emails_tenant_id" ON patient_emails (tenant_id);


CREATE INDEX ix_patient_outreaches_assigned_practitioner_id ON patient_outreaches (assigned_practitioner_id);


CREATE INDEX ix_patient_outreaches_enrolled_patient_id ON patient_outreaches (enrolled_patient_id);


CREATE INDEX ix_patient_outreaches_health_plan_id ON patient_outreaches (health_plan_id);


CREATE INDEX "IX_patient_outreaches_tenant_id" ON patient_outreaches (tenant_id);


CREATE INDEX ix_patient_phones_patient_id ON patient_phones (patient_id);


CREATE INDEX "IX_patient_phones_tenant_id" ON patient_phones (tenant_id);


CREATE INDEX ix_patients_facility_id ON patients (facility_id);


CREATE INDEX ix_patients_health_plan_id ON patients (health_plan_id);


CREATE INDEX "IX_patients_tenant_id" ON patients (tenant_id);


CREATE UNIQUE INDEX ix_patients_tenant_mrn ON patients (tenant_id, mrn) WHERE is_deleted = false;


CREATE UNIQUE INDEX ix_patients_tenant_philhealth_number ON patients (tenant_id, philhealth_number) WHERE philhealth_number IS NOT NULL AND is_deleted = false;


CREATE INDEX ix_practitioner_licensures_practitioner_id ON practitioner_licensures (practitioner_id);


CREATE INDEX "IX_practitioner_licensures_tenant_id" ON practitioner_licensures (tenant_id);


CREATE INDEX ix_practitioner_service_areas_practitioner_id ON practitioner_service_areas (practitioner_id);


CREATE INDEX "IX_practitioner_service_areas_tenant_id" ON practitioner_service_areas (tenant_id);


CREATE INDEX ix_practitioner_service_areas_zip_code ON practitioner_service_areas (zip_code);


CREATE INDEX "IX_practitioners_tenant_id" ON practitioners (tenant_id);


CREATE UNIQUE INDEX ix_practitioners_tenant_npi_number ON practitioners (tenant_id, npi_number) WHERE npi_number IS NOT NULL AND is_deleted = false;


CREATE UNIQUE INDEX ix_practitioners_tenant_prc_license_number ON practitioners (tenant_id, prc_license_number) WHERE prc_license_number IS NOT NULL AND is_deleted = false;


CREATE UNIQUE INDEX ix_practitioners_user_id ON practitioners (user_id);


CREATE INDEX ix_prescriptions_medication_id ON prescriptions (medication_id);


CREATE INDEX ix_prescriptions_patient_id ON prescriptions (patient_id);


CREATE INDEX ix_prescriptions_prescribed_by_id ON prescriptions (prescribed_by_id);


CREATE INDEX "IX_prescriptions_tenant_id" ON prescriptions (tenant_id);


CREATE INDEX ix_provider_shifts_practitioner_id ON provider_shifts (practitioner_id);


CREATE INDEX "IX_provider_shifts_tenant_id" ON provider_shifts (tenant_id);


CREATE INDEX "IX_questionnaires_tenant_id" ON questionnaires (tenant_id);


CREATE INDEX ix_questions_questionnaire_id ON questions (questionnaire_id);


CREATE INDEX "IX_questions_tenant_id" ON questions (tenant_id);


CREATE INDEX ix_schedule_blocks_practitioner_id ON schedule_blocks (practitioner_id);


CREATE INDEX "IX_schedule_blocks_tenant_id" ON schedule_blocks (tenant_id);


CREATE INDEX ix_sdoh_assessments_assessor_id ON sdoh_assessments (assessor_id);


CREATE INDEX ix_sdoh_assessments_case_id ON sdoh_assessments (case_id);


CREATE INDEX "IX_sdoh_assessments_tenant_id" ON sdoh_assessments (tenant_id);


CREATE INDEX "IX_security_audit_logs_tenant_id" ON security_audit_logs (tenant_id);


CREATE INDEX "IX_smart_phrases_tenant_id" ON smart_phrases (tenant_id);


CREATE INDEX ix_spiritual_assessments_encounter_id ON spiritual_assessments (encounter_id);


CREATE INDEX ix_spiritual_assessments_patient_id ON spiritual_assessments (patient_id);


CREATE INDEX "IX_spiritual_assessments_tenant_id" ON spiritual_assessments (tenant_id);


CREATE INDEX ix_telemetry_logs_equipment_id_recorded_at ON telemetry_logs (equipment_id, recorded_at);


CREATE INDEX "IX_telemetry_logs_tenant_id" ON telemetry_logs (tenant_id);


CREATE INDEX "IX_tenant_configurations_tenant_id" ON tenant_configurations (tenant_id);


CREATE INDEX ix_vital_signs_encounter_id ON vital_signs (encounter_id);


CREATE INDEX "IX_vital_signs_tenant_id" ON vital_signs (tenant_id);


CREATE INDEX ix_z_benefit_claims_patient_id ON z_benefit_claims (patient_id);


CREATE INDEX "IX_z_benefit_claims_tenant_id" ON z_benefit_claims (tenant_id);



-- ============================================================================
-- Custom PostgreSQL Extensions, Functions, Views & Performance Indexes
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS ix_patients_search_trgm
    ON patients USING gin (LOWER(last_name) gin_trgm_ops, LOWER(first_name) gin_trgm_ops, LOWER(mrn) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_patient_outreaches_search_trgm
    ON patient_outreaches USING gin (LOWER(last_name) gin_trgm_ops, LOWER(first_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_patient_phones_number_trgm
    ON patient_phones USING gin (LOWER(phone_number) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ix_outbox_messages_unprocessed
    ON outbox_messages (created_on_utc, next_attempt_utc)
    WHERE processed_on_utc IS NULL AND retry_count < 5;

CREATE INDEX IF NOT EXISTS ix_magic_tokens_token_hash
    ON magic_tokens (token_hash)
    WHERE is_used = false AND is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_notifications_user_unread
    ON notifications (user_id, is_read, priority DESC, created_at DESC)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_appointments_tenant_practitioner_window
    ON appointments (tenant_id, practitioner_id, scheduled_start, scheduled_end)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_appointments_tenant_start_status
    ON appointments (tenant_id, scheduled_start DESC, status)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_appointments_patient_start
    ON appointments (patient_id, status, scheduled_start DESC)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_esas_assessments_patient_assessed_desc
    ON esas_assessments (patient_id, assessed_at DESC)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_clinical_encounters_tenant_patient_date_desc
    ON clinical_encounters (tenant_id, patient_id, encounter_date DESC)
    WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS ix_vital_signs_encounter_recorded_desc
    ON vital_signs (encounter_id, recorded_at DESC)
    WHERE is_deleted = false;

CREATE OR REPLACE FUNCTION get_practitioner_shift_summary(p_practitioner_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
RETURNS TABLE (
    TotalEncounters integer,
    UnsignedNotes integer,
    DiagnosesAdded integer,
    PrescriptionsAuthorized integer,
    VitalsLogged integer,
    MedicationsAdministered integer,
    TriageActionsResolved integer,
    CasesTouched integer,
    SdohAssessmentsCompleted integer,
    BarriersMitigated integer,
    SimulatedRvus double precision
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT count(*)::int FROM "clinical_encounters" WHERE "practitioner_id" = p_practitioner_id AND "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "clinical_notes" WHERE "author_id" = p_practitioner_id AND "is_signed" = false AND "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "diagnoses" d JOIN "clinical_encounters" ce ON d."encounter_id" = ce."encounter_id" WHERE ce."practitioner_id" = p_practitioner_id AND d."created_at" >= p_start_date AND d."created_at" < p_end_date),
        (SELECT count(*)::int FROM "prescriptions" WHERE "prescribed_by_id" = p_practitioner_id AND "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "vital_signs" v JOIN "clinical_encounters" ce ON v."encounter_id" = ce."encounter_id" WHERE ce."practitioner_id" = p_practitioner_id AND v."created_at" >= p_start_date AND v."created_at" < p_end_date),
        0,
        0,
        (SELECT count(*)::int FROM "care_navigation_cases" WHERE "navigator_id" = p_practitioner_id AND "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "sdoh_assessments" WHERE "assessor_id" = p_practitioner_id AND "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "barrier_logs" b JOIN "care_navigation_cases" c ON b."case_id" = c."case_id" WHERE c."navigator_id" = p_practitioner_id AND b."created_at" >= p_start_date AND b."created_at" < p_end_date),
        ((SELECT count(*)::int FROM "clinical_encounters" WHERE "practitioner_id" = p_practitioner_id AND "created_at" >= p_start_date AND "created_at" < p_end_date) * 2.5)::double precision;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_system_shift_summary(p_start_date timestamp with time zone, p_end_date timestamp with time zone)
RETURNS TABLE (
    TotalEncounters integer,
    UnsignedNotes integer,
    DiagnosesAdded integer,
    PrescriptionsAuthorized integer,
    VitalsLogged integer,
    MedicationsAdministered integer,
    TriageActionsResolved integer,
    CasesTouched integer,
    SdohAssessmentsCompleted integer,
    BarriersMitigated integer,
    SimulatedRvus double precision
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT count(*)::int FROM "clinical_encounters" WHERE "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "clinical_notes" WHERE "is_signed" = false AND "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "diagnoses" WHERE "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "prescriptions" WHERE "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "vital_signs" WHERE "created_at" >= p_start_date AND "created_at" < p_end_date),
        0,
        0,
        (SELECT count(*)::int FROM "care_navigation_cases" WHERE "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "sdoh_assessments" WHERE "created_at" >= p_start_date AND "created_at" < p_end_date),
        (SELECT count(*)::int FROM "barrier_logs" WHERE "created_at" >= p_start_date AND "created_at" < p_end_date),
        ((SELECT count(*)::int FROM "clinical_encounters" WHERE "created_at" >= p_start_date AND "created_at" < p_end_date) * 2.5)::double precision;
END;
$$ LANGUAGE plpgsql;

CREATE MATERIALIZED VIEW vw_system_daily_summary AS
SELECT
    CURRENT_DATE as ReportDate,
    (SELECT count(*) FROM "clinical_encounters") as TotalEncounters,
    (SELECT count(*) FROM "clinical_notes" WHERE "is_signed" = false) as UnsignedNotes,
    (SELECT count(*) FROM "diagnoses") as DiagnosesAdded,
    (SELECT count(*) FROM "prescriptions") as PrescriptionsAuthorized,
    (SELECT count(*) FROM "vital_signs") as VitalsLogged,
    0 as MedicationsAdministered,
    0 as TriageActionsResolved,
    (SELECT count(*) FROM "care_navigation_cases") as CasesTouched,
    (SELECT count(*) FROM "sdoh_assessments") as SdohAssessmentsCompleted,
    (SELECT count(*) FROM "barrier_logs") as BarriersMitigated,
    ((SELECT count(*) FROM "clinical_encounters") * 2.5)::double precision as SimulatedRvus;

CREATE UNIQUE INDEX idx_vw_system_daily_summary ON vw_system_daily_summary (ReportDate);
