using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nipco.Maintenance.Api.Data;
using Nipco.Maintenance.Api.Dtos;
using Nipco.Maintenance.Api.Services;

namespace Nipco.Maintenance.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public sealed class ReportsController(MaintenanceDbContext db) : ControllerBase
{
    /// <summary>Everything the dashboard cards need in a single round-trip.</summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardDto>> Dashboard([FromQuery] DateOnly? date, CancellationToken ct = default)
    {
        var day = date ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var activeEquipment = await db.Equipment.CountAsync(e => e.IsActive, ct);
        var todayInspections = await db.DailyInspections.CountAsync(i => i.Date == day, ct);
        var totalInspections = await db.DailyInspections.CountAsync(ct);

        var resultQuery = db.InspectionResults.AsNoTracking();
        var okCount = await resultQuery.CountAsync(r => r.Status == "ok", ct);
        var nokCount = await resultQuery.CountAsync(r => r.Status == "nok", ct);
        var reviewCount = await resultQuery.CountAsync(r => r.Status == "needs_review", ct);

        var groups = await db.EquipmentGroups.AsNoTracking()
            .Where(g => g.IsActive)
            .OrderBy(g => g.Name)
            .Select(g => new GroupStatDto(g.Id, g.Name, g.Color, g.Equipment.Count(e => e.IsActive)))
            .ToArrayAsync(ct);

        var recent = await db.DailyInspections.AsNoTracking()
            .Include(i => i.Equipment)
            .Include(i => i.Technician)
            .OrderByDescending(i => i.Date).ThenByDescending(i => i.CreatedAt)
            .Take(5)
            .ToListAsync(ct);

        return Ok(new DashboardDto(activeEquipment, todayInspections, nokCount, reviewCount,
            okCount, totalInspections, groups, recent.Select(i => i.ToDto()).ToArray()));
    }

    /// <summary>Inspection trend for the last N days (default 14).</summary>
    [HttpGet("inspection-trend")]
    public async Task<ActionResult> Trend([FromQuery] int days = 14, CancellationToken ct = default)
    {
        days = Math.Clamp(days, 1, 365);
        var from = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));

        var data = await db.DailyInspections.AsNoTracking()
            .Where(i => i.Date >= from)
            .Select(i => new
            {
                i.Date,
                InspectionId = i.Id,
                Nok = i.Results.Count(r => r.Status == "nok"),
                NeedsReview = i.Results.Count(r => r.Status == "needs_review")
            })
            .ToListAsync(ct);

        var grouped = data
            .GroupBy(x => x.Date)
            .Select(g => new
            {
                date = g.Key,
                inspections = g.Count(),
                nok = g.Sum(x => x.Nok),
                needsReview = g.Sum(x => x.NeedsReview)
            })
            .OrderBy(x => x.date)
            .ToList();

        return Ok(grouped);
    }

    /// <summary>Items that failed most often, useful for preventive maintenance.</summary>
    [HttpGet("problem-items")]
    public async Task<ActionResult> ProblemItems(
        [FromQuery] int days = 30, [FromQuery] int take = 10, CancellationToken ct = default)
    {
        days = Math.Clamp(days, 1, 365);
        take = Math.Clamp(take, 1, 100);
        var from = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));

        var data = await db.InspectionResults.AsNoTracking()
            .Where(r => r.Status == "nok" && r.DailyInspection!.Date >= from)
            .GroupBy(r => new { r.CheckItemId, r.CheckItem!.Title })
            .Select(g => new { checkItemId = g.Key.CheckItemId, title = g.Key.Title, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(take)
            .ToListAsync(ct);

        return Ok(data);
    }
}
