<#
.SYNOPSIS
    Creates (or upgrades) the NIPCO_Maintenance database on SQL Server.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\install-database.ps1
    powershell -ExecutionPolicy Bypass -File deploy\install-database.ps1 -Server ".\SQLEXPRESS" -Database NIPCO_Maintenance
#>
param(
    [string]$Server = "localhost",
    [string]$Database = "NIPCO_Maintenance",
    [string]$Script = (Join-Path $PSScriptRoot "..\db\01_Install_NIPCO_Maintenance.sql"),
    [string]$VerifyScript = (Join-Path $PSScriptRoot "..\db\verify-database.sql"),
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command sqlcmd -ErrorAction SilentlyContinue)) {
    throw "sqlcmd was not found. Install 'SQL Server Command Line Utilities' or run the script in SSMS / Azure Data Studio."
}

Write-Host "Running $Script on server $Server ..." -ForegroundColor Cyan
sqlcmd -S $Server -E -b -i $Script
if ($LASTEXITCODE -ne 0) { throw "Database installation failed (exit code $LASTEXITCODE)" }

if (-not $SkipVerify -and (Test-Path $VerifyScript)) {
    Write-Host "Verifying the installation ..." -ForegroundColor Cyan
    sqlcmd -S $Server -E -b -i $VerifyScript
    if ($LASTEXITCODE -ne 0) { throw "Verification failed (exit code $LASTEXITCODE)" }
}

Write-Host "Database $Database is ready." -ForegroundColor Green
Write-Host "Sign-in accounts: takhti / esfandiari / azmian - password 123456 (change them after first login)."
