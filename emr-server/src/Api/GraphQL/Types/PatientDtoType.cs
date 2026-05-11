using Api.GraphQL.DataLoaders;
using Application.Patients.Dtos;
using Domain.Entities;
using HotChocolate;
using HotChocolate.Types;

namespace Api.GraphQL.Types;

[ExtendObjectType(typeof(PatientDto))]
public class PatientDtoType
{
    public async Task<IEnumerable<Prescription>> GetPrescriptions(
        [Parent] PatientDto patient,
        PrescriptionsByPatientIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(patient.PatientId, cancellationToken);
    }

    public async Task<IEnumerable<Diagnosis>> GetDiagnoses(
        [Parent] PatientDto patient,
        DiagnosesByPatientIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(patient.PatientId, cancellationToken);
    }

    public async Task<IEnumerable<Allergy>> GetAllergies(
        [Parent] PatientDto patient,
        AllergiesByPatientIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(patient.PatientId, cancellationToken);
    }

    public async Task<IEnumerable<PatientDocument>> GetDocuments(
        [Parent] PatientDto patient,
        DocumentsByPatientIdDataLoader dataLoader,
        CancellationToken cancellationToken
    )
    {
        return await dataLoader.LoadAsync(patient.PatientId, cancellationToken);
    }
}
