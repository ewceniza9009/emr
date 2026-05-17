using Domain.Entities;
using HotChocolate.Types;

namespace Api.GraphQL.Types;

public class EntityAddressInputType : InputObjectType<EntityAddress>
{
    protected override void Configure(IInputObjectTypeDescriptor<EntityAddress> descriptor)
    {
        descriptor.Field(t => t.Practitioner).Ignore();
        descriptor.Field(t => t.Patient).Ignore();
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
    }
}

public class PractitionerLicensureInputType : InputObjectType<PractitionerLicensure>
{
    protected override void Configure(IInputObjectTypeDescriptor<PractitionerLicensure> descriptor)
    {
        descriptor.Field(t => t.Practitioner).Ignore();
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
    }
}

public class PractitionerServiceAreaInputType : InputObjectType<PractitionerServiceArea>
{
    protected override void Configure(IInputObjectTypeDescriptor<PractitionerServiceArea> descriptor)
    {
        descriptor.Field(t => t.Practitioner).Ignore();
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
    }
}

public class PractitionerInputType : InputObjectType<Practitioner>
{
    protected override void Configure(IInputObjectTypeDescriptor<Practitioner> descriptor)
    {
        // Make ID and Link fields optional to avoid GraphQL validation errors when they are handled by logic
        descriptor.Field(t => t.UserId).Type<UuidType>();
        descriptor.Field(t => t.TenantId).Type<UuidType>();
        
        // Ensure collections are mapped to their input types
        descriptor.Field(t => t.Addresses).Type<ListType<EntityAddressInputType>>();
        descriptor.Field(t => t.Licensures).Type<ListType<PractitionerLicensureInputType>>();
        descriptor.Field(t => t.ServiceAreas).Type<ListType<PractitionerServiceAreaInputType>>();
        
        // Ignore metadata and calculated properties
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
        descriptor.Field(t => t.FullName).Ignore();
        descriptor.Field(t => t.Shifts).Ignore();
    }
}

public class FacilityInputType : InputObjectType<Facility>
{
    protected override void Configure(IInputObjectTypeDescriptor<Facility> descriptor)
    {
        descriptor.Field(t => t.TenantId).Type<UuidType>();
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
        descriptor.Field(t => t.Residents).Ignore();
    }
}

public class HealthPlanInputType : InputObjectType<HealthPlan>
{
    protected override void Configure(IInputObjectTypeDescriptor<HealthPlan> descriptor)
    {
        descriptor.Field(t => t.TenantId).Type<UuidType>();
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
        descriptor.Field(t => t.EnrolledPatients).Ignore();
        descriptor.Field(t => t.IsActive).DefaultValue(true);
    }
}

public class MedicationInputType : InputObjectType<Medication>
{
    protected override void Configure(IInputObjectTypeDescriptor<Medication> descriptor)
    {
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
    }
}

public class SmartPhraseInputType : InputObjectType<SmartPhrase>
{
    protected override void Configure(IInputObjectTypeDescriptor<SmartPhrase> descriptor)
    {
        descriptor.Field(t => t.TenantId).Type<UuidType>();
        descriptor.Field(t => t.Category).Type<StringType>().DefaultValue("General");
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
    }
}

public class QuestionnaireInputType : InputObjectType<Questionnaire>
{
    protected override void Configure(IInputObjectTypeDescriptor<Questionnaire> descriptor)
    {
        descriptor.Field(t => t.TenantId).Type<UuidType>();
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
        descriptor.Field(t => t.Questions).Ignore();
    }
}

public class DurableMedicalEquipmentInputType : InputObjectType<DurableMedicalEquipment>
{
    protected override void Configure(IInputObjectTypeDescriptor<DurableMedicalEquipment> descriptor)
    {
        descriptor.Field(t => t.TenantId).Type<UuidType>();
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
        descriptor.Field(t => t.Deliveries).Ignore();
        descriptor.Field(t => t.TelemetryLogs).Ignore();
        descriptor.Field(t => t.LastMaintenanceDate).Ignore();
    }
}

public class OutreachScriptInputType : InputObjectType<OutreachScript>
{
    protected override void Configure(IInputObjectTypeDescriptor<OutreachScript> descriptor)
    {
        descriptor.Field(t => t.TenantId).Type<UuidType>();
        descriptor.Field(t => t.CreatedAt).Ignore();
        descriptor.Field(t => t.CreatedBy).Ignore();
        descriptor.Field(t => t.UpdatedAt).Ignore();
        descriptor.Field(t => t.UpdatedBy).Ignore();
        descriptor.Field(t => t.IsDeleted).Ignore();
    }
}
