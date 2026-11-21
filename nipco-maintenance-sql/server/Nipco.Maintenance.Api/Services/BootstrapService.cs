using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Nipco.Maintenance.Api.Data;

namespace Nipco.Maintenance.Api.Services;

/// <summary>
/// Makes the database usable no matter how it was created:
///  * ensures the four roles exist,
///  * gives active users that have no password hash yet the configured default
///    password (using ASP.NET Identity's own hasher - no hash is shipped in SQL),
///  * optionally creates a bootstrap admin (Bootstrap:AdminUsername/Password).
/// Safe to run on every start; it is idempotent.
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

        await AssignDefaultPasswordsAsync(ct);
        await EnsureRoleMembershipsAsync(ct);
        await EnsureBootstrapAdminAsync();
    }

    /// <summary>Seed users created by the SQL script have no password hash yet.</summary>
    private async Task AssignDefaultPasswordsAsync(CancellationToken ct)
    {
        var defaultPassword = configuration["Bootstrap:DefaultUserPassword"];
        if (string.IsNullOrWhiteSpace(defaultPassword)) return;

        var users = await db.Users.Where(u => u.PasswordHash == null && u.IsActive).ToListAsync(ct);
        foreach (var user in users)
        {
            var result = await userManager.AddPasswordAsync(user, defaultPassword);
            if (result.Succeeded)
                logger.LogInformation("Default password assigned to {User}", user.UserName);
            else
                logger.LogWarning("Could not assign a default password to {User}: {Errors}", user.UserName,
                    string.Join("; ", result.Errors.Select(e => e.Description)));
        }
    }

    /// <summary>The SQL script fills AppUser.Role; mirror it into AspNetUserRoles.</summary>
    private async Task EnsureRoleMembershipsAsync(CancellationToken ct)
    {
        var users = await db.Users.ToListAsync(ct);
        foreach (var user in users)
        {
            var expected = Mappers.RoleToIdentity(user.Role);
            var current = await userManager.GetRolesAsync(user);
            if (current.Count == 1 && current[0] == expected) continue;
            if (current.Count == 0 && await roleManager.RoleExistsAsync(expected))
            {
                var result = await userManager.AddToRoleAsync(user, expected);
                if (result.Succeeded) logger.LogInformation("Role {Role} assigned to {User}", expected, user.UserName);
            }
        }
    }

    private async Task EnsureBootstrapAdminAsync()
    {
        var username = configuration["Bootstrap:AdminUsername"];
        var password = configuration["Bootstrap:AdminPassword"];
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password)) return;
        if (await userManager.FindByNameAsync(username) is not null) return;

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
