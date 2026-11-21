using System.Security.Claims;

namespace Nipco.Maintenance.Api.Services;

public sealed class CurrentUser(IHttpContextAccessor accessor)
{
    public ClaimsPrincipal? Principal => accessor.HttpContext?.User;
    public string Id => Principal?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
    public string Role => Principal?.FindFirstValue(ClaimTypes.Role) ?? "";
    public bool IsAdmin => Role.Equals("Admin", StringComparison.OrdinalIgnoreCase);
    public bool IsSupervisorOrAdmin =>
        IsAdmin || Role.Equals("Supervisor", StringComparison.OrdinalIgnoreCase);
    public string DisplayName => Principal?.FindFirstValue("fullName") ?? "";
}
