using Microsoft.AspNetCore.Identity;
using Nipco.Maintenance.Api.Data;

namespace Nipco.Maintenance.Api.Services;

/// <summary>
/// Makes the API usable even when the database was created empty
/// (for example by `dotnet ef database update` instead of the SQL script).
/// Idempotent: roles are ensured, and an admin user is created only when
/// Bootstrap:AdminUsername / Bootstrap:AdminPassword are configured.
/// </summary>
public sealed class BootstrapService(
    MaintenanceDbContext db,
    RoleManager<IdentityRole> roleManager,
    UserManager<AppUser> userManager,
    IConfiguration configuration,
    ILogger<BootstrapService> logger)
{
    private static readonly string[] Roles = ["Admin", "Supervisor", "Technician", "Viewer"];

    public async Task RunAsync(CancellationToken ct = default)
    {
        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
                logger.LogInformation("Created role {Role}", role);
            }
        }

        var username = configuration["Bootstrap:AdminUsername"];
        var password = configuration["Bootstrap:AdminPassword"];
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            return;

        if (await userManager.FindByNameAsync(username) is not null)
            return;

        var admin = new AppUser
        {
            UserName = username,
            FullName = configuration["Bootstrap:AdminFullName"] ?? "مدیر سیستم",
            PersonnelCode = "1001",
            Role = "Admin",
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(admin, password);
        if (!result.Succeeded)
        {
            logger.LogError("Bootstrap admin creation failed: {Errors}",
                string.Join("; ", result.Errors.Select(e => e.Description)));
            return;
        }

        await userManager.AddToRoleAsync(admin, "Admin");
        logger.LogInformation("Bootstrap admin user {User} created.", username);
    }
}
