using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Nipco.Maintenance.Api.Data;

namespace Nipco.Maintenance.Api.Services;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "NIPCO.Maintenance";
    public string Audience { get; set; } = "NIPCO.Maintenance.Client";
    public string Key { get; set; } = "";
    public int ExpiryHours { get; set; } = 12;
}

public sealed class TokenService(JwtOptions options)
{
    public (string token, DateTime expiresAt) Create(AppUser user)
    {
        var expires = DateTime.UtcNow.AddHours(Math.Clamp(options.ExpiryHours, 1, 24 * 30));
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? ""),
            new("fullName", user.FullName),
            new("personnelCode", user.PersonnelCode),
            new(ClaimTypes.Role, user.Role),
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: options.Issuer,
            audience: options.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
