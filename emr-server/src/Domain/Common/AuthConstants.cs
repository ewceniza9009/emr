namespace Domain.Common;

public static class Roles
{
    public const string Admin = "Admin";
    public const string MedicalDirector = "MedicalDirector";
    public const string CareNavigator = "CareNavigator";
    public const string Nurse = "Nurse";
    public const string SocialWorker = "SocialWorker";
    public const string Chaplain = "Chaplain";
    public const string AdminCoordinator = "AdminCoordinator";
    public const string Practitioner = "Practitioner"; // Generic fallback
}

public static class Permissions
{
    public static class Patients
    {
        public const string View = "patients:view";
        public const string Edit = "patients:edit";
        public const string Delete = "patients:delete";
        public const string Enrollment = "patients:enrollment";
    }

    public static class Clinical
    {
        public const string View = "clinical:view";
        public const string Order = "clinical:order";
        public const string Chart = "clinical:chart";
        public const string Assessments = "clinical:assessments";
    }

    public static class Scheduling
    {
        public const string View = "scheduling:view";
        public const string Manage = "scheduling:manage";
    }

    public static class Billing
    {
        public const string View = "billing:view";
        public const string Manage = "billing:manage";
    }

    public static class Setup
    {
        public const string View = "setup:view";
        public const string Manage = "setup:manage";
    }

    public static class Logistics
    {
        public const string View = "logistics:view";
        public const string Manage = "logistics:manage";
    }

    public static class Documentation
    {
        public const string View = "docs:view";
        public const string Edit = "docs:edit";
        public const string Delete = "docs:delete";
        public const string Sign = "docs:sign";
    }

    public static class Pharmacy
    {
        public const string View = "pharmacy:view";
        public const string Order = "pharmacy:order";
        public const string Audit = "pharmacy:audit";
    }

    public static class Analytics
    {
        public const string View = "analytics:view";
        public const string Export = "analytics:export";
    }

    public static class Integrations
    {
        public const string View = "integrations:view";
        public const string Manage = "integrations:manage";
        public const string Sync = "integrations:sync";
    }
}
