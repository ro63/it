using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nipco.Maintenance.Api.Data;
using Nipco.Maintenance.Api.Dtos;
using Nipco.Maintenance.Api.Services;

namespace Nipco.Maintenance.Api.Controllers;

[ApiController]
[Route("api/check-items")]
[Authorize]
public sealed class CheckItemsController(MaintenanceDbContext db, AuditService audit) : ControllerBase
{
    private static readonly string[] AllowedTypes = ["boolean", "numeric", "text"];

    [HttpGet]
    public async Task<ActionResult<CheckItemDto[]>> GetAll(
        [FromQuery] Guid? groupId, [FromQuery] bool includeInactive = false, CancellationToken ct = default)
    {
        var query = db.CheckItems.AsNoTracking().Include(i => i.Groups).AsQueryable();

        if (groupId.HasValue) query = query.Where(i => i.Groups.Any(g => g.EquipmentGroupId == groupId.Value));
        if (!includeInactive) query = query.Where(i => i.IsActive);

        var items = await query.OrderBy(i => i.SortOrder).ThenBy(i => i.Title).ToListAsync(ct);
        return Ok(items.Select(i => i.ToDto()).ToArray());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CheckItemDto>> Get(Guid id, CancellationToken ct)
    {
        var item = await db.CheckItems.AsNoTracking().Include(i => i.Groups)
            .FirstOrDefaultAsync(i => i.Id == id, ct);
        return item is null ? NotFound() : Ok(item.ToDto());
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<ActionResult<CheckItemDto>> Create([FromBody] SaveCheckItemRequest request, CancellationToken ct)
    {
        var type = string.IsNullOrWhiteSpace(request.Type) ? "boolean" : request.Type.Trim().ToLowerInvariant();
        if (!AllowedTypes.Contains(type))
            return BadRequest(new { message = "نوع آیتم چک‌لیست نامعتبر است" });

        var groupIds = (request.EquipmentGroupIds ?? Array.Empty<Guid>()).Distinct().ToList();
        if (groupIds.Count == 0)
            return BadRequest(new { message = "حداقل یک گروه تجهیزات باید انتخاب شود" });

        var existingGroups = await db.EquipmentGroups.Where(g => groupIds.Contains(g.Id))
            .Select(g => g.Id).ToListAsync(ct);
        if (existingGroups.Count != groupIds.Count)
            return BadRequest(new { message = "گروه تجهیزات انتخاب شده یافت نشد" });

        var sortOrder = request.Order ?? ((await db.CheckItems.MaxAsync(i => (int?)i.SortOrder, ct)) ?? 0) + 1;

        var item = new CheckItem
        {
            Title = request.Title.Trim(),
            Type = type,
            Unit = request.Unit?.Trim(),
            MinValue = request.MinValue,
            MaxValue = request.MaxValue,
            IsRequired = request.IsRequired ?? true,
            IsActive = request.IsActive ?? true,
            SectionType = request.SectionType?.Trim(),
            SortOrder = sortOrder,
            Groups = groupIds.Select(g => new CheckItemGroup { EquipmentGroupId = g }).ToList()
        };

        db.CheckItems.Add(item);
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Create", nameof(CheckItem), item.Id, item.Title, ct);

        item = await db.CheckItems.Include(i => i.Groups).FirstAsync(i => i.Id == item.Id, ct);
        return CreatedAtAction(nameof(Get), new { id = item.Id }, item.ToDto());
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<ActionResult<CheckItemDto>> Update(Guid id, [FromBody] SaveCheckItemRequest request, CancellationToken ct)
    {
        var item = await db.CheckItems.Include(i => i.Groups).FirstOrDefaultAsync(i => i.Id == id, ct);
        if (item is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Type))
        {
            var type = request.Type.Trim().ToLowerInvariant();
            if (!AllowedTypes.Contains(type))
                return BadRequest(new { message = "نوع آیتم چک‌لیست نامعتبر است" });
            item.Type = type;
        }

        item.Title = request.Title.Trim();
        if (request.Unit is not null) item.Unit = request.Unit.Trim();
        if (request.MinValue.HasValue) item.MinValue = request.MinValue;
        if (request.MaxValue.HasValue) item.MaxValue = request.MaxValue;
        if (request.IsRequired.HasValue) item.IsRequired = request.IsRequired.Value;
        if (request.IsActive.HasValue) item.IsActive = request.IsActive.Value;
        if (request.SectionType is not null) item.SectionType = request.SectionType.Trim();
        if (request.Order.HasValue) item.SortOrder = request.Order.Value;

        if (request.EquipmentGroupIds is not null)
        {
            var groupIds = request.EquipmentGroupIds.Distinct().ToList();
            if (groupIds.Count == 0)
                return BadRequest(new { message = "حداقل یک گروه تجهیزات باید انتخاب شود" });

            if (await db.EquipmentGroups.CountAsync(g => groupIds.Contains(g.Id), ct) != groupIds.Count)
                return BadRequest(new { message = "گروه تجهیزات انتخاب شده یافت نشد" });

            var toRemove = item.Groups.Where(g => !groupIds.Contains(g.EquipmentGroupId)).ToList();
            foreach (var link in toRemove) item.Groups.Remove(link);

            var existing = item.Groups.Select(g => g.EquipmentGroupId).ToList();
            foreach (var gid in groupIds.Where(g => !existing.Contains(g)))
                item.Groups.Add(new CheckItemGroup { CheckItemId = item.Id, EquipmentGroupId = gid });
        }

        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Update", nameof(CheckItem), item.Id, item.Title, ct);

        item = await db.CheckItems.Include(i => i.Groups).FirstAsync(i => i.Id == item.Id, ct);
        return Ok(item.ToDto());
    }

    /// <summary>Soft delete: the item stays in history, it just stops appearing in new forms.</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var item = await db.CheckItems.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (item is null) return NotFound();

        item.IsActive = false;
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Deactivate", nameof(CheckItem), item.Id, item.Title, ct);
        return NoContent();
    }
}
