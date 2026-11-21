<#
.SYNOPSIS
    Builds the NIPCO daily equipment control system into a ready-to-install folder
    (React SPA + ASP.NET Core API hosted together, SQL Server backend).

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\publish.ps1 -OutputPath C:\NIPCO\app
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

Write-Host "==> 1/4 installing frontend packages" -ForegroundColor Cyan
Push-Location $root
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

Write-Host "==> 2/4 building React app" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "vite build failed" }

Write-Host "==> 3/4 copying SPA into the API wwwroot" -ForegroundColor Cyan
if (Test-Path $wwwroot) { Remove-Item $wwwroot -Recurse -Force }
New-Item -ItemType Directory -Path $wwwroot | Out-Null
Copy-Item (Join-Path $root "dist\*") $wwwroot -Recurse -Force

Write-Host "==> 4/4 publishing ASP.NET Core API to $OutputPath" -ForegroundColor Cyan
Push-Location $apiDir
dotnet publish -c $Configuration -r $Runtime --self-contained false -o $OutputPath
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }
Pop-Location

Copy-Item (Join-Path $root "db") (Join-Path $OutputPath "db") -Recurse -Force
Copy-Item (Join-Path $root "docs") (Join-Path $OutputPath "docs") -Recurse -Force

Pop-Location
Write-Host "Done. Install folder: $OutputPath" -ForegroundColor Green
