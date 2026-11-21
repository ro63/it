using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Nipco.Maintenance.Api.Data;
using Nipco.Maintenance.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ------------------------------------------------------------------ database
var connectionString = builder.Configuration.GetConnectionString("Maintenance")
    ?? throw new InvalidOperationException("Connection string 'Maintenance' is not configured.");

builder.Services.AddDbContext<MaintenanceDbContext>(options =>
    options.UseSqlServer(connectionString, sql =>
    {
        sql.EnableRetryOnFailure(3);
        sql.CommandTimeout(60);
    }));

// ------------------------------------------------------------------ identity
builder.Services.AddIdentityCore<AppUser>(options =>
    {
        options.Password.RequiredLength = 6;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.User.RequireUniqueEmail = false;
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<MaintenanceDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

// ---------------------------------------------------------------------- jwt
var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();

// A key must be supplied. For local installs the installer writes one into appsettings.Production.json.
if (string.IsNullOrWhiteSpace(jwtOptions.Key) || jwtOptions.Key.Length < 32)
{
    var envKey = Environment.GetEnvironmentVariable("NIPCO_JWT_KEY");
    if (!string.IsNullOrWhiteSpace(envKey) && envKey.Length >= 32)
        jwtOptions.Key = envKey;
    else
        throw new InvalidOperationException(
            "Jwt:Key is missing. Set a random key of at least 32 characters in appsettings.json, " +
            "appsettings.Production.json or the NIPCO_JWT_KEY environment variable.");
}

builder.Services.AddSingleton(jwtOptions);
builder.Services.AddSingleton<TokenService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUser>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<BootstrapService>();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

// ---------------------------------------------------------------------- cors
var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (origins.Length == 0)
            policy.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        else
            policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// --------------------------------------------------------------------- app
var app = builder.Build();

app.UseCors();

app.UseDefaultFiles();     // serves the built React app (wwwroot/index.html)
app.UseStaticFiles();

// A light CSP-free header set is enough here: the SPA is served from the same origin.
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "SAMEORIGIN";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Simple health probe for IIS / monitoring.
app.MapGet("/health", async (MaintenanceDbContext db, CancellationToken ct) =>
{
    var dbOk = await db.Database.CanConnectAsync(ct);
    return Results.Json(new
    {
        status = dbOk ? "ok" : "degraded",
        database = dbOk ? "reachable" : "unreachable",
        utc = DateTime.UtcNow
    }, statusCode: dbOk ? StatusCodes.Status200OK : StatusCodes.Status503ServiceUnavailable);
});

// SPA fallback: every non-api path returns index.html so client routing keeps working
app.MapFallbackToFile("index.html");

// ----------------------------------------------------------------- startup check
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MaintenanceDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        if (await db.Database.CanConnectAsync())
        {
            logger.LogInformation("Connected to SQL Server database {Database}.", db.Database.GetDbConnection().Database);

            if (app.Configuration.GetValue("Bootstrap:EnsureOnStartup", true))
                await scope.ServiceProvider.GetRequiredService<BootstrapService>().RunAsync();
        }
        else
        {
            logger.LogError("Cannot reach the SQL Server database. Run db/01_Install_NIPCO_Maintenance.sql first " +
                            "and check ConnectionStrings:Maintenance.");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database connectivity check failed.");
    }
}

app.Run();
