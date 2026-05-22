using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data.Common;
using System.Data;
using Infrastructure.Data;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ReportController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ReportController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("shift-summary")]
    public async Task<IActionResult> GetShiftSummary([FromQuery] Guid? practitionerId, [FromQuery] DateTimeOffset? date)
    {
        try
        {
            var targetDate = date?.Date ?? DateTimeOffset.UtcNow.Date;
            var startOfDay = targetDate;
            var endOfDay = startOfDay.AddDays(1);

            if (practitionerId.HasValue && practitionerId.Value != Guid.Empty)
            {
                // Practitioner specific
                using var command = _context.Database.GetDbConnection().CreateCommand();
                command.CommandText = "SELECT * FROM get_practitioner_shift_summary(@p0, @p1, @p2)";
                
                var p0 = command.CreateParameter();
                p0.ParameterName = "@p0";
                p0.Value = practitionerId.Value;
                command.Parameters.Add(p0);
                
                var p1 = command.CreateParameter();
                p1.ParameterName = "@p1";
                p1.Value = startOfDay;
                command.Parameters.Add(p1);
                
                var p2 = command.CreateParameter();
                p2.ParameterName = "@p2";
                p2.Value = endOfDay;
                command.Parameters.Add(p2);

                await _context.Database.OpenConnectionAsync();
                using var reader = await command.ExecuteReaderAsync();
                if (await reader.ReadAsync())
                {
                    var result = new
                    {
                        TotalEncounters = reader.IsDBNull(0) ? 0 : reader.GetInt32(0),
                        UnsignedNotes = reader.IsDBNull(1) ? 0 : reader.GetInt32(1),
                        DiagnosesAdded = reader.IsDBNull(2) ? 0 : reader.GetInt32(2),
                        PrescriptionsAuthorized = reader.IsDBNull(3) ? 0 : reader.GetInt32(3),
                        VitalsLogged = reader.IsDBNull(4) ? 0 : reader.GetInt32(4),
                        MedicationsAdministered = reader.IsDBNull(5) ? 0 : reader.GetInt32(5),
                        TriageActionsResolved = reader.IsDBNull(6) ? 0 : reader.GetInt32(6),
                        CasesTouched = reader.IsDBNull(7) ? 0 : reader.GetInt32(7),
                        SdohAssessmentsCompleted = reader.IsDBNull(8) ? 0 : reader.GetInt32(8),
                        BarriersMitigated = reader.IsDBNull(9) ? 0 : reader.GetInt32(9),
                        SimulatedRvus = reader.IsDBNull(10) ? 0 : reader.GetDouble(10)
                    };
                    return Ok(result);
                }
                return Ok(new { TotalEncounters = 0, SimulatedRvus = 0 });
            }
            else
            {
                // System-wide admin summary
                await _context.Database.OpenConnectionAsync();

                using var selectCmd = _context.Database.GetDbConnection().CreateCommand();
                selectCmd.CommandText = "SELECT * FROM get_system_shift_summary(@p1, @p2)";
                
                var p1 = selectCmd.CreateParameter();
                p1.ParameterName = "@p1";
                p1.Value = startOfDay;
                selectCmd.Parameters.Add(p1);
                
                var p2 = selectCmd.CreateParameter();
                p2.ParameterName = "@p2";
                p2.Value = endOfDay;
                selectCmd.Parameters.Add(p2);

                using var reader = await selectCmd.ExecuteReaderAsync();
                
                if (await reader.ReadAsync())
                {
                    var result = new
                    {
                        TotalEncounters = reader.IsDBNull(0) ? 0 : reader.GetInt32(0),
                        UnsignedNotes = reader.IsDBNull(1) ? 0 : reader.GetInt32(1),
                        DiagnosesAdded = reader.IsDBNull(2) ? 0 : reader.GetInt32(2),
                        PrescriptionsAuthorized = reader.IsDBNull(3) ? 0 : reader.GetInt32(3),
                        VitalsLogged = reader.IsDBNull(4) ? 0 : reader.GetInt32(4),
                        MedicationsAdministered = reader.IsDBNull(5) ? 0 : reader.GetInt32(5),
                        TriageActionsResolved = reader.IsDBNull(6) ? 0 : reader.GetInt32(6),
                        CasesTouched = reader.IsDBNull(7) ? 0 : reader.GetInt32(7),
                        SdohAssessmentsCompleted = reader.IsDBNull(8) ? 0 : reader.GetInt32(8),
                        BarriersMitigated = reader.IsDBNull(9) ? 0 : reader.GetInt32(9),
                        SimulatedRvus = reader.IsDBNull(10) ? 0 : reader.GetDouble(10)
                    };
                    return Ok(result);
                }
                return Ok(new { TotalEncounters = 0, SimulatedRvus = 0 });
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        finally
        {
            await _context.Database.CloseConnectionAsync();
        }
    }
}
