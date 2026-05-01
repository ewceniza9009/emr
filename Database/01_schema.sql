CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 3
CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL
);

-- 4
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 6
CREATE TABLE facilities (
    facility_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_name VARCHAR(150) NOT NULL,
    facility_type VARCHAR(50) NOT NULL, -- e.g., 'Hospital', 'Hospice Center', 'Clinic'
    address TEXT NOT NULL
);

-- 7
CREATE TABLE departments (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID REFERENCES facilities(facility_id),
    department_name VARCHAR(100) NOT NULL
);

-- 8
CREATE TABLE audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    ip_address INET,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9
CREATE TABLE practitioners (
    practitioner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(user_id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    prc_license_number VARCHAR(50) UNIQUE,
    npi_number VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 10
CREATE TABLE practitioner_specialties (
    specialty_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID REFERENCES practitioners(practitioner_id),
    specialty_name VARCHAR(100) NOT NULL -- 'Palliative Physician', 'Social Worker'
);

-- 11
CREATE TABLE credentials (
    credential_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID REFERENCES practitioners(practitioner_id) ON DELETE CASCADE,
    certification_name VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    expiration_date DATE
);

-- 12
CREATE TABLE practitioner_facilities (
    practitioner_id UUID REFERENCES practitioners(practitioner_id),
    facility_id UUID REFERENCES facilities(facility_id),
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (practitioner_id, facility_id)
);

-- 13
CREATE TABLE schedule_blocks (
    block_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID REFERENCES practitioners(practitioner_id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL -- 'AVAILABLE', 'BOOKED', 'BLOCKED'
);

-- 14
CREATE TABLE time_off_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID REFERENCES practitioners(practitioner_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- 15
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mrn VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    biological_sex VARCHAR(20) NOT NULL,
    gender_identity VARCHAR(50),
    philhealth_number VARCHAR(50) UNIQUE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16
CREATE TABLE patient_contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    is_emergency BOOLEAN DEFAULT FALSE,
    is_primary_caregiver BOOLEAN DEFAULT FALSE
);

-- 17
CREATE TABLE patient_insurance (
    insurance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    provider_name VARCHAR(100) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE
);

-- 18
CREATE TABLE advance_directives (
    directive_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    document_type VARCHAR(100) NOT NULL, -- 'Living Will', 'DNR'
    code_status VARCHAR(50) NOT NULL,
    verified_by UUID REFERENCES practitioners(practitioner_id),
    verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19
CREATE TABLE proxy_authorizations (
    proxy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    contact_id UUID REFERENCES patient_contacts(contact_id),
    legal_document_url VARCHAR(255)
);

-- 20
CREATE TABLE consent_forms (
    consent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    form_type VARCHAR(100) NOT NULL,
    is_signed BOOLEAN DEFAULT FALSE,
    signed_at TIMESTAMPTZ
);

-- 21
CREATE TABLE patient_tags (
    tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    tag_name VARCHAR(50) NOT NULL -- 'High Fall Risk', 'Isolation'
);

-- 22
CREATE TABLE care_navigation_cases (
    case_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    navigator_id UUID REFERENCES practitioners(practitioner_id),
    acuity_level VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 23
CREATE TABLE sdoh_assessments (
    sdoh_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    assessor_id UUID REFERENCES practitioners(practitioner_id),
    food_insecurity BOOLEAN DEFAULT FALSE,
    housing_instability BOOLEAN DEFAULT FALSE,
    transportation_barrier BOOLEAN DEFAULT FALSE,
    financial_toxicity BOOLEAN DEFAULT FALSE,
    assessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 24
CREATE TABLE navigation_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES care_navigation_cases(case_id),
    assigned_to UUID REFERENCES practitioners(practitioner_id),
    description TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- 25
CREATE TABLE barrier_logs (
    barrier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES care_navigation_cases(case_id),
    barrier_category VARCHAR(100) NOT NULL, -- 'Cultural', 'Financial'
    description TEXT NOT NULL
);

-- 26
CREATE TABLE intervention_logs (
    intervention_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES care_navigation_cases(case_id),
    action_taken TEXT NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create a strict ENUM for the modality to prevent bad data entry
CREATE TYPE appointment_modality_enum AS ENUM (
    'IN_PERSON_FACILITY', 
    'IN_PERSON_HOME_VISIT', 
    'TELEHEALTH_VIDEO', 
    'TELEHEALTH_AUDIO_ONLY'
);

-- 27
CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    encounter_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    modality appointment_modality_enum NOT NULL DEFAULT 'IN_PERSON_FACILITY',
    meeting_link VARCHAR(255)
);

-- 28
CREATE TABLE appointment_resources (
    appointment_id UUID REFERENCES appointments(appointment_id),
    block_id UUID REFERENCES schedule_blocks(block_id),
    PRIMARY KEY (appointment_id, block_id)
);

-- 29
CREATE TABLE clinical_encounters (
    encounter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID UNIQUE REFERENCES appointments(appointment_id),
    patient_id UUID REFERENCES patients(patient_id),
    primary_provider_id UUID REFERENCES practitioners(practitioner_id),
    facility_id UUID REFERENCES facilities(facility_id),
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- 30
CREATE TABLE diagnoses (
    diagnosis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    icd10_code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    diagnosed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 31
CREATE TABLE allergies (
    allergy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    allergen VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    reaction TEXT
);

-- 32
CREATE TABLE vitals (
    vital_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    systolic SMALLINT,
    diastolic SMALLINT,
    heart_rate SMALLINT,
    respiratory_rate SMALLINT,
    spo2 SMALLINT,
    temperature NUMERIC(4,2),
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 33
CREATE TABLE esas_assessments (
    esas_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    pain SMALLINT CHECK (pain BETWEEN 0 AND 10),
    tiredness SMALLINT CHECK (tiredness BETWEEN 0 AND 10),
    drowsiness SMALLINT CHECK (drowsiness BETWEEN 0 AND 10),
    nausea SMALLINT CHECK (nausea BETWEEN 0 AND 10),
    shortness_of_breath SMALLINT CHECK (shortness_of_breath BETWEEN 0 AND 10),
    anxiety SMALLINT CHECK (anxiety BETWEEN 0 AND 10),
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 34
CREATE TABLE clinical_notes (
    note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    author_id UUID REFERENCES practitioners(practitioner_id),
    note_text TEXT NOT NULL,
    note_type VARCHAR(50) NOT NULL, -- 'SOAP', 'Progress'
    signed_at TIMESTAMPTZ
);

-- 35
CREATE TABLE wound_assessments (
    wound_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    location VARCHAR(100) NOT NULL,
    stage VARCHAR(50),
    length_cm NUMERIC(5,2),
    width_cm NUMERIC(5,2),
    depth_cm NUMERIC(5,2)
);

-- 36
CREATE TABLE spiritual_assessments (
    spiritual_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    assessor_id UUID REFERENCES practitioners(practitioner_id),
    belief_system VARCHAR(100),
    distress_level VARCHAR(50),
    interventions TEXT
);

-- 37
CREATE TABLE psychosocial_assessments (
    psych_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    assessor_id UUID REFERENCES practitioners(practitioner_id),
    family_dynamics TEXT,
    coping_mechanisms TEXT,
    grief_stage VARCHAR(50)
);

-- 38
CREATE TABLE karnofsky_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    score SMALLINT CHECK (score BETWEEN 0 AND 100),
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 39
CREATE TABLE medication_catalog (
    med_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generic_name VARCHAR(150) NOT NULL,
    brand_name VARCHAR(150),
    controlled_substance_schedule VARCHAR(10)
);

-- 40
CREATE TABLE medication_orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    patient_id UUID REFERENCES patients(patient_id),
    prescriber_id UUID REFERENCES practitioners(practitioner_id),
    med_id UUID REFERENCES medication_catalog(med_id),
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    is_prn BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL
);

-- 41
CREATE TABLE medication_administrations (
    admin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES medication_orders(order_id),
    administered_by UUID REFERENCES practitioners(practitioner_id),
    administered_at TIMESTAMPTZ NOT NULL,
    dose_given VARCHAR(100) NOT NULL
);

-- 42
CREATE TABLE lab_orders (
    lab_order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    test_name VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL,
    ordered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 43
CREATE TABLE lab_results (
    result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id UUID REFERENCES lab_orders(lab_order_id),
    metric_name VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    reference_range VARCHAR(100),
    is_abnormal BOOLEAN DEFAULT FALSE
);

-- 44
CREATE TABLE imaging_orders (
    imaging_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES clinical_encounters(encounter_id),
    modality VARCHAR(50) NOT NULL, -- 'X-Ray', 'CT Scan'
    body_part VARCHAR(100) NOT NULL,
    report_text TEXT,
    status VARCHAR(50) NOT NULL
);

-- 45
CREATE TABLE care_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    created_by UUID REFERENCES practitioners(practitioner_id),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 46
CREATE TABLE care_goals (
    goal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES care_plans(plan_id),
    description TEXT NOT NULL,
    target_date DATE,
    status VARCHAR(50) NOT NULL
);

-- 47
CREATE TABLE multidisciplinary_reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES care_plans(plan_id),
    meeting_date DATE NOT NULL,
    summary_notes TEXT NOT NULL
);

-- 48
CREATE TABLE bereavement_tracking (
    bereavement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES patient_contacts(contact_id),
    patient_id UUID REFERENCES patients(patient_id),
    risk_level VARCHAR(50) NOT NULL,
    follow_up_date DATE
);

-- 49
CREATE TABLE z_benefit_packages (
    package_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    icd10_target VARCHAR(20) NOT NULL,
    package_name VARCHAR(150) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL
);

-- 50
CREATE TABLE z_benefit_enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    package_id UUID REFERENCES z_benefit_packages(package_id),
    preauth_status VARCHAR(50) NOT NULL,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 51
CREATE TABLE mdt_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID REFERENCES z_benefit_enrollments(enrollment_id),
    phase_name VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    cleared_at TIMESTAMPTZ
);

-- 52
CREATE TABLE z_benefit_claims (
    claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_id UUID REFERENCES z_benefit_enrollments(enrollment_id),
    tranche_number INTEGER NOT NULL,
    claim_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL -- 'Submitted', 'Paid', 'Denied'
);

-- 53
CREATE TABLE billing_invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    total_amount NUMERIC(10,2) NOT NULL,
    amount_due NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- 54
CREATE TABLE billing_line_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES billing_invoices(invoice_id),
    description VARCHAR(255) NOT NULL,
    charge_amount NUMERIC(10,2) NOT NULL
);

-- 55
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES billing_invoices(invoice_id),
    amount_paid NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    paid_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 56
CREATE TABLE dme_catalog (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL
);

-- 57
CREATE TABLE dme_inventory (
    asset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES dme_catalog(item_id),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL -- 'In Warehouse', 'Deployed'
);

-- 58
CREATE TABLE dme_orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    asset_id UUID REFERENCES dme_inventory(asset_id),
    ordered_by UUID REFERENCES practitioners(practitioner_id),
    deployed_at TIMESTAMPTZ,
    retrieved_at TIMESTAMPTZ
);

-- 59
CREATE TABLE volunteers (
    volunteer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(user_id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    clearance_date DATE
);

-- 60
CREATE TABLE volunteer_shifts (
    shift_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_id UUID REFERENCES volunteers(volunteer_id),
    patient_id UUID REFERENCES patients(patient_id),
    activity_type VARCHAR(100) NOT NULL,
    hours_logged NUMERIC(5,2) NOT NULL
);

-- 61
CREATE TABLE communication_threads (
    thread_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    topic VARCHAR(200) NOT NULL
);

-- 62
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES communication_threads(thread_id),
    sender_id UUID REFERENCES users(user_id),
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 63
CREATE TABLE iot_devices (
    device_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    device_type VARCHAR(100) NOT NULL, -- 'Wearable Watch', 'Pulse Ox'
    mac_address VARCHAR(50) UNIQUE
);

-- 64
CREATE TABLE iot_telemetry (
    telemetry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES iot_devices(device_id),
    metric_type VARCHAR(50) NOT NULL,
    metric_value NUMERIC(10,2) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL
);

-- 65
CREATE TABLE system_alerts (
    alert_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(patient_id),
    alert_type VARCHAR(100) NOT NULL, -- 'High Pain Score', 'Abnormal Vitals'
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
