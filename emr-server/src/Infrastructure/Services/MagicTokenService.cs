using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Services;

public class MagicTokenService : IMagicTokenService
{
    private readonly IApplicationDbContext _context;

    public MagicTokenService(IApplicationDbContext context)
    {
        _context = context;
    }

    private byte[] DeriveKey(string deviceId)
    {
        string masterPepper = "Halkyone_ClinicalOS_Secure_MagicToken_Master_PepperKey_2026";
        using var sha255 = SHA256.Create();
        return sha255.ComputeHash(Encoding.UTF8.GetBytes(masterPepper + deviceId));
    }

    private string ComputeHash(string plainText)
    {
        using var sha256 = SHA256.Create();
        byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(plainText));
        return Convert.ToBase64String(hashBytes);
    }

    private string Encrypt(string plainText, byte[] key)
    {
        using var aes = Aes.Create();
        aes.Key = key;
        aes.GenerateIV(); // Unique random IV per token to defend against replay and dictionary attacks!

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        
        // Write IV first so we can read it during decryption
        ms.Write(aes.IV, 0, aes.IV.Length);

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }

        return Convert.ToBase64String(ms.ToArray())
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", ""); // URL-Safe Base64
    }

    private string Decrypt(string cipherText, byte[] key)
    {
        try
        {
            // Restore standard Base64
            string base64 = cipherText.Replace('-', '+').Replace('_', '/');
            switch (base64.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }

            byte[] cipherBytes = Convert.FromBase64String(base64);
            using var ms = new MemoryStream(cipherBytes);

            // Read IV first
            byte[] iv = new byte[16];
            if (ms.Read(iv, 0, iv.Length) < iv.Length)
            {
                return string.Empty;
            }

            using var aes = Aes.Create();
            aes.Key = key;
            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);

            return sr.ReadToEnd();
        }
        catch
        {
            return string.Empty; // Fail gracefully on decryption failure (wrong Device ID)
        }
    }

    public async Task<string> GenerateMagicLinkAsync(Guid patientId, bool isCaregiver, string deviceId, string baseUrl, Guid tenantId)
    {
        // 1. Generate a cryptographically secure random token value (32 bytes)
        byte[] tokenBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(tokenBytes);
        }
        string rawToken = Convert.ToBase64String(tokenBytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .Replace("=", ""); // URL-Safe Base64

        // 2. Encrypt the token using a key derived from the Device ID
        byte[] derivedKey = DeriveKey(deviceId);
        string encryptedValue = Encrypt(rawToken, derivedKey);
        string tokenHash = ComputeHash(rawToken);

        // 3. Store the MagicToken in the DB
        var magicToken = new MagicToken
        {
            MagicTokenId = Guid.NewGuid(),
            TenantId = tenantId,
            PatientId = patientId,
            TokenValue = encryptedValue,
            TokenHash = tokenHash,
            DeviceId = deviceId,
            IsCaregiver = isCaregiver,
            ExpiresAt = DateTimeOffset.UtcNow.AddHours(24), // 24-hour single-use window
            IsUsed = false
        };

        _context.MagicTokens.Add(magicToken);
        await _context.SaveChangesAsync(default);

        // 4. Return the fully formed hardware-bound login URL
        if (deviceId == "DYNAMIC_BIND")
        {
            return $"{baseUrl.TrimEnd('/')}/login?token={rawToken}";
        }
        return $"{baseUrl.TrimEnd('/')}/login?token={rawToken}&deviceId={deviceId}";
    }

    public async Task<(bool success, string? errorMessage, Guid patientId, bool isCaregiver)> ValidateMagicTokenAsync(string token, string deviceId)
    {
        // 1. Query the database using the fast TokenHash
        string tokenHash = ComputeHash(token);
        var magicToken = await _context.MagicTokens
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

        if (magicToken == null)
        {
            return (false, "Invalid token.", Guid.Empty, false);
        }

        if (magicToken.IsUsed)
        {
            return (false, "Token has already been used.", Guid.Empty, false);
        }

        if (magicToken.ExpiresAt < DateTimeOffset.UtcNow)
        {
            return (false, "Token has expired.", Guid.Empty, false);
        }

        // 2. Try to decrypt the stored TokenValue
        string decryptedRawToken = string.Empty;

        if (magicToken.DeviceId == "DYNAMIC_BIND")
        {
            // Dynamic First-Use Binding link!
            byte[] derivedKey = DeriveKey("DYNAMIC_BIND");
            decryptedRawToken = Decrypt(magicToken.TokenValue, derivedKey);

            if (string.IsNullOrEmpty(decryptedRawToken) || decryptedRawToken != token)
            {
                return (false, "Access Denied: Invalid activation token.", Guid.Empty, false);
            }

            // This is a valid activation link! Perform permanent dynamic trust binding!
            var patient = await _context.Patients
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.PatientId == magicToken.PatientId);

            if (patient != null)
            {
                // Set the persistent device ID permanently if not set yet!
                if (string.IsNullOrEmpty(patient.DeviceSignature))
                {
                    patient.DeviceSignature = deviceId;
                    _context.Patients.Update(patient);
                    Console.WriteLine($"[DFUTB] Dynamic Trust Bound deviceId '{deviceId}' permanently to Patient MRN: {patient.Mrn}");
                }
            }

            // Update the magic token's deviceId to lock it going forward
            magicToken.DeviceId = deviceId;
        }
        else
        {
            // Fully bound token validation
            byte[] derivedKey = DeriveKey(magicToken.DeviceId);
            decryptedRawToken = Decrypt(magicToken.TokenValue, derivedKey);

            if (string.IsNullOrEmpty(decryptedRawToken) || decryptedRawToken != token || magicToken.DeviceId != deviceId)
            {
                return (false, "Access Denied: This magic token is locked to another device and cannot be decrypted.", Guid.Empty, false);
            }
        }

        // 4. Mark token as consumed
        magicToken.IsUsed = true;
        await _context.SaveChangesAsync(default);

        return (true, null, magicToken.PatientId, magicToken.IsCaregiver);
    }
}
