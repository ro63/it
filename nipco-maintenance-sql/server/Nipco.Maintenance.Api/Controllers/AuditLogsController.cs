using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nipco.Maintenance.Api.Data;
using Nipco.Maintenance.Api.Dtos;

namespace Nipco.Maintenance.Api.Controllers;

[ApiController]
[Route("api/audit-logs")]
[Authorize(Roles = "Admin,Supervisor")]
public sealed class AuditLogsController(MaintenanceDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] string? entityName, [FromQuery] int page = 1, [FromQuery] int pageSize = 100,
        CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var query = db.AuditLogs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(entityName)) query = query.Where(a => a.EntityName == entityName);

        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return Ok(new PagedResult<AuditLog>(total, page, pageSize, items.ToArray()));
    }
}
