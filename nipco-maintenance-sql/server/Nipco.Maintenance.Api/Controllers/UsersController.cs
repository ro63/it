using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nipco.Maintenance.Api.Data;
using Nipco.Maintenance.Api.Dtos;
using Nipco.Maintenance.Api.Services;

namespace Nipco.Maintenance.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin,Supervisor")]
public sealed class UsersController(
    MaintenanceDbContext db,
    UserManager<AppUser> userManager,
    AuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UserDto[]>> GetAll([FromQuery] string? role, [FromQuery] string? search, CancellationToken ct)
    {
        var query = db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(role))
        {
            var identityRole = Mappers.RoleToIdentity(role);
            query = query.Where(u => u.Role == identityRole);
        }

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u => u.FullName.Contains(search) || u.UserName!.Contains(search)
                                     || u.PersonnelCode.Contains(search));

        var users = await query.OrderBy(u => u.FullName).ToListAsync(ct);
        return Ok(users.Select(u => u.ToDto()).ToArray());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> Get(string id, CancellationToken ct)
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);
        return user is null ? NotFound() : Ok(user.ToDto());
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        var user = new AppUser
        {
            UserName = request.Username.Trim(),
            FullName = request.FullName.Trim(),
            PersonnelCode = request.PersonnelCode?.Trim() ?? "",
            Mobile = request.Mobile?.Trim(),
            PhoneNumber = request.Mobile?.Trim(),
            Role = Mappers.RoleToIdentity(request.Role),
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        user.SetSectionAccess(request.SectionAccess);

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return BadRequest(new { message = "ایجاد کاربر انجام نشد", errors = result.Errors.Select(e => e.Description) });

        await userManager.AddToRoleAsync(user, user.Role);
        await audit.WriteAsync("Create", nameof(AppUser), user.Id, user.UserName, ct);

        return CreatedAtAction(nameof(Get), new { id = user.Id }, user.ToDto());
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> Update(string id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        user.FullName = request.FullName?.Trim() ?? user.FullName;
        user.PersonnelCode = request.PersonnelCode?.Trim() ?? user.PersonnelCode;
        user.Mobile = request.Mobile?.Trim() ?? user.Mobile;
        user.PhoneNumber = user.Mobile;

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var newRole = Mappers.RoleToIdentity(request.Role);
            if (!string.Equals(newRole, user.Role, StringComparison.Ordinal))
            {
                var currentRoles = await userManager.GetRolesAsync(user);
                await userManager.RemoveFromRolesAsync(user, currentRoles);
                await userManager.AddToRoleAsync(user, newRole);
                user.Role = newRole;
            }
        }

        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
        if (request.SectionAccess is not null) user.SetSectionAccess(request.SectionAccess);

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var token = await userManager.GeneratePasswordResetTokenAsync(user);
            var reset = await userManager.ResetPasswordAsync(user, token, request.Password);
            if (!reset.Succeeded)
                return BadRequest(new { message = "تغییر رمز انجام نشد", errors = reset.Errors.Select(e => e.Description) });
            await userManager.UpdateSecurityStampAsync(user);
        }

        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = "بروزرسانی انجام نشد", errors = result.Errors.Select(e => e.Description) });

        await audit.WriteAsync("Update", nameof(AppUser), user.Id, user.UserName, ct);
        return Ok(user.ToDto());
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        // Soft delete keeps inspection history intact (FK: DailyInspections -> AspNetUsers).
        user.IsActive = false;
        user.LockoutEnabled = true;
        user.LockoutEnd = DateTimeOffset.MaxValue;
        await userManager.UpdateAsync(user);

        await audit.WriteAsync("Deactivate", nameof(AppUser), user.Id, user.UserName, ct);
        return NoContent();
    }
}
