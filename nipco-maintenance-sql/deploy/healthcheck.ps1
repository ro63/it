<#
.SYNOPSIS
    Checks that the deployed API answers and can reach SQL Server.
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\healthcheck.ps1 -Url http://localhost:8080
#>
param([string]$Url = "http://localhost:8080")

$ErrorActionPreference = "Stop"
try {
    $response = Invoke-WebRequest -Uri "$Url/health" -UseBasicParsing -TimeoutSec 15
    Write-Host "HTTP $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content -ForegroundColor Gray
} catch {
    Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check: the site/service is running, the port is open, appsettings.Production.json is valid." -ForegroundColor Yellow
    exit 1
}

try {
    $index = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    if ($index.Content -match 'id="root"') { Write-Host "SPA is served correctly." -ForegroundColor Green }
    else { Write-Host "The root URL does not look like the SPA build." -ForegroundColor Yellow }
} catch {
    Write-Host "Root URL failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
