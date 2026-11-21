using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nipco.Maintenance.Api.Data;
using Nipco.Maintenance.Api.Dtos;
using Nipco.Maintenance.Api.Services;

namespace Nipco.Maintenance.Api.Controllers;

[ApiController]
[Route("api/equipment-groups")]
[Authorize]
public sealed class EquipmentGroupsController(MaintenanceDbContext db, AuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<EquipmentGroupDto[]>> GetAll([FromQuery] bool includeInactive = true, CancellationToken ct = default)
    {
        var query = db.EquipmentGroups.AsNoTracking();
        if (!includeInactive) query = query.Where(g => g.IsActive);

        var groups = await query
            .OrderBy(g => g.Name)
            .Select(g => new { Group = g, Count = g.Equipment.Count(e => e.IsActive) })
            .ToListAsync(ct);

        return Ok(groups.Select(x => x.Group.ToDto(x.Count)).ToArray());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EquipmentGroupDto>> Get(Guid id, CancellationToken ct)
    {
        var group = await db.EquipmentGroups.AsNoTracking()
            .Select(g => new { Group = g, Count = g.Equipment.Count(e => e.IsActive) })
            .FirstOrDefaultAsync(g => g.Group.Id == id, ct);
        return group is null ? NotFound() : Ok(group.Group.ToDto(group.Count));
    }

    [HttpGet("{id:guid}/check-items")]
    public async Task<ActionResult<CheckItemDto[]>> GetCheckItems(Guid id, CancellationToken ct)
    {
        if (!await db.EquipmentGroups.AnyAsync(g => g.Id == id, ct)) return NotFound();

        var items = await db.CheckItems.AsNoTracking()
            .Include(i => i.Groups)
            .Where(i => i.Groups.Any(g => g.EquipmentGroupId == id) && i.IsActive)
            .OrderBy(i => i.SortOrder)
            .ToListAsync(ct);

        return Ok(items.Select(i => i.ToDto()).ToArray());
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<ActionResult<EquipmentGroupDto>> Create([FromBody] SaveEquipmentGroupRequest request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        if (await db.EquipmentGroups.AnyAsync(g => g.Name == name, ct))
            return Conflict(new { message = "گروهی با این نام قبلاً ثبت شده است" });

        var group = new EquipmentGroup
        {
            Name = name,
            Description = request.Description?.Trim(),
            Color = string.IsNullOrWhiteSpace(request.Color) ? "#2563eb" : request.Color.Trim(),
            Theme = string.IsNullOrWhiteSpace(request.Theme) ? "default" : request.Theme.Trim(),
            IsActive = request.IsActive ?? true
        };

        db.EquipmentGroups.Add(group);
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Create", nameof(EquipmentGroup), group.Id, group.Name, ct);

        return CreatedAtAction(nameof(Get), new { id = group.Id }, group.ToDto());
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<ActionResult<EquipmentGroupDto>> Update(Guid id, [FromBody] SaveEquipmentGroupRequest request, CancellationToken ct)
    {
        var group = await db.EquipmentGroups.FirstOrDefaultAsync(g => g.Id == id, ct);
        if (group is null) return NotFound();

        var name = request.Name.Trim();
        if (await db.EquipmentGroups.AnyAsync(g => g.Name == name && g.Id != id, ct))
            return Conflict(new { message = "گروهی با این نام قبلاً ثبت شده است" });

        group.Name = name;
        if (request.Description is not null) group.Description = request.Description.Trim();
        if (!string.IsNullOrWhiteSpace(request.Color)) group.Color = request.Color.Trim();
        if (!string.IsNullOrWhiteSpace(request.Theme)) group.Theme = request.Theme.Trim();
        if (request.IsActive.HasValue) group.IsActive = request.IsActive.Value;

        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Update", nameof(EquipmentGroup), group.Id, group.Name, ct);

        return Ok(group.ToDto());
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var group = await db.EquipmentGroups.FirstOrDefaultAsync(g => g.Id == id, ct);
        if (group is null) return NotFound();

        if (await db.Equipment.AnyAsync(e => e.GroupId == id, ct))
            return Conflict(new { message = "این گروه دارای تجهیز است و قابل حذف نیست" });

        group.IsActive = false;                 // keep the row, checklist mappings stay valid
        await db.SaveChangesAsync(ct);
        await audit.WriteAsync("Deactivate", nameof(EquipmentGroup), group.Id, group.Name, ct);

        return NoContent();
    }
}
