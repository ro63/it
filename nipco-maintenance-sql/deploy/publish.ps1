<#
.SYNOPSIS
    Builds a ready-to-install folder for the NIPCO daily equipment control system
    (React SPA + ASP.NET Core API on the same origin, SQL Server backend).

.DESCRIPTION
    Steps: npm ci -> vite build (production, no demo data) -> copy SPA to the API's
    wwwroot -> dotnet publish -> copy db/docs/deploy helpers next to the output.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\publish.ps1 -OutputPath C:\NIPCO\publish

.NOTES
    Needs Node.js 20+ and .NET SDK 10 on the build machine.
    The output folder is what gets copied to the server.
#>
param(
    [string]$OutputPath = (Join-Path $PSScriptRoot "..\publish"),
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$apiDir = Join-Path $root "server\Nipco.Maintenance.Api"
$wwwroot = Join-Path $apiDir "wwwroot"

function Assert-Tool([string]$name, [string]$hint) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "'$name' was not found. $hint"
    }
}

Assert-Tool node "Install Node.js 20 or newer."
Assert-Tool dotnet "Install the .NET 10 SDK."
$dotnetVersion = (dotnet --version)
if ($dotnetVersion -notlike "10.*") {
    Write-Host "WARNING: .NET SDK $dotnetVersion detected, the project targets net10.0." -ForegroundColor Yellow
}

Write-Host "==> 1/4 restoring frontend packages" -ForegroundColor Cyan
Push-Location $root
if (Test-Path "package-lock.json") { npm ci } else { npm install }
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

Write-Host "==> 2/4 building the React app (production)" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "vite build failed" }
if (-not (Test-Path (Join-Path $root "dist\index.html"))) { throw "dist\index.html was not produced" }

Write-Host "==> 3/4 publishing the API" -ForegroundColor Cyan
if (Test-Path $wwwroot) { Remove-Item $wwwroot -Recurse -Force }
New-Item -ItemType Directory -Path $wwwroot | Out-Null
Copy-Item (Join-Path $root "dist\*") $wwwroot -Recurse -Force

Push-Location $apiDir
dotnet publish -c $Configuration -r $Runtime --self-contained false -o $OutputPath
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "dotnet publish failed" }
Pop-Location
Pop-Location

if (-not (Test-Path (Join-Path $OutputPath "wwwroot\index.html"))) {
    throw "wwwroot\index.html is missing from the publish output - the SPA would not load."
}

Write-Host "==> 4/4 copying database scripts, helpers and documentation" -ForegroundColor Cyan
Copy-Item (Join-Path $root "db") (Join-Path $OutputPath "db") -Recurse -Force
Copy-Item (Join-Path $root "docs") (Join-Path $OutputPath "docs") -Recurse -Force
Copy-Item (Join-Path $root "deploy") (Join-Path $OutputPath "deploy") -Recurse -Force

# Keep the web.config that dotnet publish generates; add a ready appsettings template.
$sample = Join-Path $apiDir "appsettings.Production.Sample.json"
if (Test-Path $sample) {
    Copy-Item $sample (Join-Path $OutputPath "appsettings.Production.Sample.json") -Force
}

Write-Host ""
Write-Host "Install folder ready: $OutputPath" -ForegroundColor Green
Write-Host "Next: copy it to the server, create appsettings.Production.json, run db\01_Install_NIPCO_Maintenance.sql" -ForegroundColor Green
