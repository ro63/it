using Nipco.Maintenance.Api.Data;

namespace Nipco.Maintenance.Api.Services;

public sealed class AuditService(MaintenanceDbContext db, CurrentUser currentUser)
{
    public async Task WriteAsync(string action, string entityName, object entityId, string? details = null,
        CancellationToken ct = default)
    {
        db.AuditLogs.Add(new AuditLog
        {
            ActorId = string.IsNullOrEmpty(currentUser.Id) ? null : currentUser.Id,
            Action = Truncate(action, 100),
            EntityName = Truncate(entityName, 100),
            EntityId = Truncate(entityId.ToString() ?? "", 100),
            Details = details is null ? null : Truncate(details, 2000),
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);
    }

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..max];
}
