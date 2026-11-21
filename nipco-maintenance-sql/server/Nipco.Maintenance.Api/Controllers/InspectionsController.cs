using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nipco.Maintenance.Api.Data;
using Nipco.Maintenance.Api.Dtos;
using Nipco.Maintenance.Api.Services;

namespace Nipco.Maintenance.Api.Controllers;

[ApiController]
[Route("api/inspections")]
[Authorize]
public sealed class InspectionsController(
    MaintenanceDbContext db,
    CurrentUser currentUser,
    AuditService audit) : ControllerBase
{
    private static readonly string[] ResultStatuses = ["ok", "nok", "needs_review"];
    private static readonly string[] InspectionStatuses = ["completed", "pending", "overdue"];
    private static readonly string[] Shifts = ["shift1", "shift2", "shift3"];

    private IQueryable<DailyInspection> Query() => db.DailyInspections
        .Include(i => i.Equipment)
        .Include(i => i.Technician)
        .Include(i => i.Results).ThenInclude(r => r.CheckItem);

    [HttpGet]
    public async Task<ActionResult<PagedResult<InspectionDto>>> GetAll(
        [FromQuery] Guid? equipmentId, [FromQuery] Guid? groupId, [FromQuery] string? shiftId,
        [FromQuery] string? status, [FromQuery] DateOnly? from, [FromQuery] DateOnly? to,
        [FromQuery] string? technicianId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = Query().AsNoTracking().AsQueryable();

        if (equipmentId.HasValue) query = query.Where(i => i.EquipmentId == equipmentId.Value);
        if (groupId.HasValue) query = query.Where(i => i.Equipment!.GroupId == groupId.Value);
        if (!string.IsNullOrWhiteSpace(shiftId)) query = query.Where(i => i.ShiftId == shiftId);
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(i => i.Status == status);
        if (from.HasValue) query = query.Where(i => i.Date >= from.Value);
        if (to.HasValue) query = query.Where(i => i.Date <= to.Value);
        if (!string.IsNullOrWhiteSpace(technicianId)) query = query.Where(i => i.TechnicianId == technicianId);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(i => i.Date).ThenByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

        return Ok(new PagedResult<InspectionDto>(total, page, pageSize, items.Select(i => i.ToDto()).ToArray()));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InspectionDto>> Get(Guid id, CancellationToken ct)
    {
        var inspection = await Query().AsNoTracking().FirstOrDefaultAsync(i => i.Id == id, ct);
        return inspection is null ? NotFound() : Ok(inspection.ToDto());
    }

    [HttpPost]
    public async Task<ActionResult<InspectionDto>> Create([FromBody] CreateInspectionRequest request, CancellationToken ct)
    {
        if (request.Results is null || request.Results.Count == 0)
            return BadRequest(new { message = "هیچ نتیجه‌ای برای ثبت ارسال نشده است" });

        var equipment = await db.Equipment.FirstOrDefaultAsync(e => e.Id == request.EquipmentId, ct);
        if (equipment is null) return BadRequest(new { message = "تجهیز یافت نشد" });

        var shift = string.IsNullOrWhiteSpace(request.ShiftId) ? "shift1" : request.ShiftId.Trim();
        if (!Shifts.Contains(shift))
            return BadRequest(new { message = "شیفت نامعتبر است" });

        var status = string.IsNullOrWhiteSpace(request.Status) ? "completed" : request.Status.Trim();
        if (!InspectionStatuses.Contains(status))
            return BadRequest(new { message = "وضعیت بازدید نامعتبر است" });

        foreach (var r in request.Results)
        {
            if (!ResultStatuses.Contains(r.Status))
                return BadRequest(new { message = $"وضعیت نتیجه '{r.Status}' نامعتبر است" });
        }

        var checkItemIds = request.Results.Select(r => r.CheckItemId).Distinct().ToList();
        var validItems = await db.CheckItems.Where(i => checkItemIds.Contains(i.Id))
            .Select(i => i.Id).ToListAsync(ct);
        if (validItems.Count != checkItemIds.Count)
            return BadRequest(new { message = "یکی از آیتم‌های چک‌لیست یافت نشد" });

        var technicianId = currentUser.Id;
        if (string.IsNullOrEmpty(technicianId)) return Unauthorized();

        var inspection = new DailyInspection
        {
            EquipmentId = request.EquipmentId,
            TechnicianId = technicianId,
            ShiftId = shift,
            Date = request.Date ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Results = request.Results.Select(r => new InspectionResult
            {
                CheckItemId = r.CheckItemId,
                Status = r.Status,
                Value = r.Value,
                TextValue = r.TextValue,
                Comment = r.Comment,
                TechnicianId = technicianId,
                Timestamp = DateTime.UtcNow
            }).ToList()
        };

        db.DailyInspections.Add(inspection);
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Create", nameof(DailyInspection), inspection.Id,
            $"{equipment.Code} / {inspection.Date:yyyy-MM-dd} / {shift}", ct);

        var created = await Query().AsNoTracking().FirstAsync(i => i.Id == inspection.Id, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created.ToDto());
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<ActionResult<InspectionDto>> Update(Guid id, [FromBody] CreateInspectionRequest request, CancellationToken ct)
    {
        var inspection = await db.DailyInspections.Include(i => i.Results)
            .FirstOrDefaultAsync(i => i.Id == id, ct);
        if (inspection is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (!InspectionStatuses.Contains(request.Status))
                return BadRequest(new { message = "وضعیت بازدید نامعتبر است" });
            inspection.Status = request.Status;
        }

        if (!string.IsNullOrWhiteSpace(request.ShiftId) && Shifts.Contains(request.ShiftId))
            inspection.ShiftId = request.ShiftId;

        if (request.Results is { Count: > 0 })
        {
            foreach (var r in request.Results)
            {
                if (!ResultStatuses.Contains(r.Status))
                    return BadRequest(new { message = $"وضعیت نتیجه '{r.Status}' نامعتبر است" });

                var target = inspection.Results.FirstOrDefault(x => x.CheckItemId == r.CheckItemId);
                if (target is null)
                {
                    inspection.Results.Add(new InspectionResult
                    {
                        CheckItemId = r.CheckItemId,
                        Status = r.Status,
                        Value = r.Value,
                        TextValue = r.TextValue,
                        Comment = r.Comment,
                        TechnicianId = currentUser.Id,
                        Timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    target.Status = r.Status;
                    target.Value = r.Value;
                    target.TextValue = r.TextValue;
                    target.Comment = r.Comment;
                    target.Timestamp = DateTime.UtcNow;
                }
            }
        }

        inspection.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Update", nameof(DailyInspection), inspection.Id, inspection.Status, ct);

        var updated = await Query().AsNoTracking().FirstAsync(i => i.Id == id, ct);
        return Ok(updated.ToDto());
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var inspection = await db.DailyInspections.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (inspection is null) return NotFound();

        db.DailyInspections.Remove(inspection);   // results cascade
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Delete", nameof(DailyInspection), id, null, ct);
        return NoContent();
    }
}
