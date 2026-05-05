using System;
using System.Threading.Tasks;

namespace Application.Common.Interfaces;

public interface IPdfService
{
    Task<byte[]> GenerateEncounterSummaryAsync(Guid appointmentId);
}
