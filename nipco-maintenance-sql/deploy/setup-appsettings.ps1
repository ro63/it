<#
.SYNOPSIS
    Creates appsettings.Production.json next to the published API with a fresh
    random JWT key, so the API can start without manual editing.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\setup-appsettings.ps1 `
        -AppPath C:\NIPCO\publish -Server ".\SQLEXPRESS" -Database NIPCO_Maintenance

.EXAMPLE (SQL login instead of Windows authentication)
    ... -UseSqlLogin -SqlUser nipco_app -SqlPassword 'P@ssw0rd'
#>
param(
    [Parameter(Mandatory = $true)][string]$AppPath,
    [string]$Server = ".\SQLEXPRESS",
    [string]$Database = "NIPCO_Maintenance",
    [switch]$UseSqlLogin,
    [string]$SqlUser,
    [string]$SqlPassword
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $AppPath)) { throw "$AppPath does not exist" }

if ($UseSqlLogin) {
    if (-not $SqlUser -or -not $SqlPassword) { throw "with -UseSqlLogin both -SqlUser and -SqlPassword are required" }
    $connection = "Server=$Server;Database=$Database;User Id=$SqlUser;Password=$SqlPassword;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
} else {
    $connection = "Server=$Server;Database=$Database;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;MultipleActiveResultSets=True"
}

# 48 random bytes -> base64, well above the 32 character minimum
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$jwtKey = [Convert]::ToBase64String($bytes)

$config = [ordered]@{
    ConnectionStrings = @{ Maintenance = $connection }
    Jwt = [ordered]@{
        Issuer = "NIPCO.Maintenance"
        Audience = "NIPCO.Maintenance.Client"
        Key = $jwtKey
        ExpiryHours = 12
    }
    Cors = @{ AllowedOrigins = @() }
    Bootstrap = [ordered]@{
        EnsureOnStartup = $true
        DefaultUserPassword = "123456"
        AdminUsername = ""
        AdminPassword = ""
        AdminFullName = "مدیر سیستم"
    }
    AllowedHosts = "*"
    Logging = [ordered]@{ LogLevel = [ordered]@{ Default = "Information"; Microsoft.AspNetCore = "Warning" } }
}

$path = Join-Path $AppPath "appsettings.Production.json"
if (Test-Path $path) {
    $backup = "$path.bak-$(Get-Date -Format yyyyMMdd-HHmmss)"
    Copy-Item $path $backup
    Write-Host "Existing file backed up to $backup" -ForegroundColor Yellow
}

$config | ConvertTo-Json -Depth 6 | Set-Content -Path $path -Encoding UTF8
Write-Host "Created $path" -ForegroundColor Green
Write-Host "JWT key generated (48 random bytes, base64)." -ForegroundColor Green
Write-Host "Default password for the seed users: 123456 - change it after the first sign-in." -ForegroundColor Yellow
