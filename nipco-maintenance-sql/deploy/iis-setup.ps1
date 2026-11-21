<#
.SYNOPSIS
    Publishes the app to IIS (Windows Server) including the Application Pool and site.

.NOTES
    Run from an elevated PowerShell on the web server.
    Requires: IIS with ASP.NET Core 10 Hosting Bundle, the .NET 10 runtime and SQL Server.
#>
param(
    [string]$SiteName = "NIPCO-Maintenance",
    [string]$PhysicalPath = "C:\inetpub\NIPCO-Maintenance",
    [int]$Port = 80,
    [string]$AppPool = "NIPCO-Maintenance-Pool"
)

$ErrorActionPreference = "Stop"

Import-Module WebAdministration

if (-not (Test-Path $PhysicalPath)) { New-Item -ItemType Directory -Path $PhysicalPath | Out-Null }

if (-not (Test-Path "IIS:\AppPools\$AppPool")) {
    New-WebAppPool -Name $AppPool | Out-Null
}
Set-ItemProperty "IIS:\AppPools\$AppPool" -Name managedRuntimeVersion -Value ""

if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Write-Host "Site $SiteName already exists - updating physical path." -ForegroundColor Yellow
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $PhysicalPath
} else {
    New-Website -Name $SiteName -PhysicalPath $PhysicalPath -Port $Port -ApplicationPool $AppPool -Force | Out-Null
}

Write-Host "IIS site '$SiteName' -> $PhysicalPath (port $Port)" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Create appsettings.Production.json next to Nipco.Maintenance.Api.dll (see docs/install.md)"
Write-Host "  2. Grant the app pool identity db_datareader/db_datawriter on NIPCO_Maintenance"
Write-Host "  3. Grant it read/write access to the data protection key folder"
