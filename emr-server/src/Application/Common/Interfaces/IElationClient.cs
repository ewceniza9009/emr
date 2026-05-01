namespace Application.Common.Interfaces;

public interface IElationClient
{
    Task<bool> PushSoapNoteAsync(Guid encounterId, CancellationToken cancellationToken = default);
    Task<bool> SyncPatientDemographicsAsync(Guid patientId, CancellationToken cancellationToken = default);
}
