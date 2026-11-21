using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nipco.Maintenance.Api.Data;
using Nipco.Maintenance.Api.Dtos;
using Nipco.Maintenance.Api.Services;

namespace Nipco.Maintenance.Api.Controllers;

[ApiController]
[Route("api/equipment")]
[Authorize]
public sealed class EquipmentController(MaintenanceDbContext db, AuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<EquipmentDto[]>> GetAll(
        [FromQuery] Guid? groupId, [FromQuery] string? search, [FromQuery] bool includeInactive = true,
        CancellationToken ct = default)
    {
        var query = db.Equipment.AsNoTracking().Include(e => e.Group).AsQueryable();

        if (groupId.HasValue) query = query.Where(e => e.GroupId == groupId.Value);
        if (!includeInactive) query = query.Where(e => e.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(e => e.Code.Contains(search) || e.Name.Contains(search)
                                     || e.Location.Contains(search));

        var items = await query.OrderBy(e => e.Code).ToListAsync(ct);
        return Ok(items.Select(e => e.ToDto()).ToArray());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EquipmentDto>> Get(Guid id, CancellationToken ct)
    {
        var item = await db.Equipment.AsNoTracking().Include(e => e.Group)
            .FirstOrDefaultAsync(e => e.Id == id, ct);
        return item is null ? NotFound() : Ok(item.ToDto());
    }

    /// <summary>Used by the QR scanner screen (scans QR payload or the equipment code).</summary>
    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<EquipmentDto>> GetByCode(string code, CancellationToken ct)
    {
        var normalized = code.Trim();
        var item = await db.Equipment.AsNoTracking().Include(e => e.Group)
            .FirstOrDefaultAsync(e => e.QrCode == normalized || e.Code == normalized, ct);
        return item is null ? NotFound(new { message = "تجهیز با این کد یافت نشد" }) : Ok(item.ToDto());
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<ActionResult<EquipmentDto>> Create([FromBody] SaveEquipmentRequest request, CancellationToken ct)
    {
        var code = request.Code.Trim();
        if (await db.Equipment.AnyAsync(e => e.Code == code, ct))
            return Conflict(new { message = "کد تجهیز تکراری است" });

        if (!await db.EquipmentGroups.AnyAsync(g => g.Id == request.GroupId, ct))
            return BadRequest(new { message = "گروه تجهیز یافت نشد" });

        var qr = string.IsNullOrWhiteSpace(request.QrCode) ? code : request.QrCode.Trim();
        if (await db.Equipment.AnyAsync(e => e.QrCode == qr, ct))
            return Conflict(new { message = "کد QR تکراری است" });

        var item = new Equipment
        {
            Code = code,
            Name = request.Name.Trim(),
            Type = string.IsNullOrWhiteSpace(request.Type) ? "custom" : request.Type.Trim(),
            GroupId = request.GroupId,
            Location = request.Location?.Trim() ?? "",
            IsActive = request.IsActive ?? true,
            QrCode = qr,
            ImageUrl = request.ImageUrl,
            CommissioningDate = request.CommissioningDate
        };

        db.Equipment.Add(item);
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Create", nameof(Equipment), item.Id, $"{item.Code} / {item.Name}", ct);

        item = await db.Equipment.Include(e => e.Group).FirstAsync(e => e.Id == item.Id, ct);
        return CreatedAtAction(nameof(Get), new { id = item.Id }, item.ToDto());
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<ActionResult<EquipmentDto>> Update(Guid id, [FromBody] SaveEquipmentRequest request, CancellationToken ct)
    {
        var item = await db.Equipment.Include(e => e.Group).FirstOrDefaultAsync(e => e.Id == id, ct);
        if (item is null) return NotFound();

        var code = request.Code.Trim();
        if (await db.Equipment.AnyAsync(e => e.Code == code && e.Id != id, ct))
            return Conflict(new { message = "کد تجهیز تکراری است" });

        if (!await db.EquipmentGroups.AnyAsync(g => g.Id == request.GroupId, ct))
            return BadRequest(new { message = "گروه تجهیز یافت نشد" });

        var qr = string.IsNullOrWhiteSpace(request.QrCode) ? code : request.QrCode.Trim();
        if (await db.Equipment.AnyAsync(e => e.QrCode == qr && e.Id != id, ct))
            return Conflict(new { message = "کد QR تکراری است" });

        item.Code = code;
        item.Name = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Type)) item.Type = request.Type.Trim();
        item.GroupId = request.GroupId;
        if (request.Location is not null) item.Location = request.Location.Trim();
        if (request.IsActive.HasValue) item.IsActive = request.IsActive.Value;
        item.QrCode = qr;
        if (request.ImageUrl is not null) item.ImageUrl = request.ImageUrl;
        if (request.CommissioningDate.HasValue) item.CommissioningDate = request.CommissioningDate;

        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Update", nameof(Equipment), item.Id, $"{item.Code} / {item.Name}", ct);

        item = await db.Equipment.Include(e => e.Group).FirstAsync(e => e.Id == item.Id, ct);
        return Ok(item.ToDto());
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var item = await db.Equipment.FirstOrDefaultAsync(e => e.Id == id, ct);
        if (item is null) return NotFound();

        if (await db.DailyInspections.AnyAsync(i => i.EquipmentId == id, ct))
        {
            item.IsActive = false;              // keep history, just retire the asset
            await db.SaveChangesAsync(ct);
            await audit.WriteAsync("Deactivate", nameof(Equipment), item.Id, item.Code, ct);
            return NoContent();
        }

        db.Equipment.Remove(item);
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Delete", nameof(Equipment), item.Id, item.Code, ct);
        return NoContent();
    }
}
