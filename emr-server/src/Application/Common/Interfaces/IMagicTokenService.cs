using System;
using System.Threading.Tasks;

namespace Application.Common.Interfaces;

public interface IMagicTokenService
{
    Task<string> GenerateMagicLinkAsync(Guid patientId, bool isCaregiver, string deviceId, string baseUrl, Guid tenantId);
    Task<(bool success, string? errorMessage, Guid patientId, bool isCaregiver)> ValidateMagicTokenAsync(string token, string deviceId);
}
