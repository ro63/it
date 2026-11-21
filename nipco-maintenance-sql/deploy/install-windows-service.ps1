<#
.SYNOPSIS
    Registers the API as a Windows service (no IIS needed) using the built-in
    "Windows Service" hosting of ASP.NET Core... via a simple wrapper.

.DESCRIPTION
    Windows service hosting requires Microsoft.Extensions.Hosting.WindowsServices.
    Instead of changing the app, this script uses the .NET CLI to run the published
    app as a scheduled task at startup, which needs no extra package.

    If you prefer a real service, use NSSM (https://nssm.cc) with the same paths:
        nssm install NIPCO-Maintenance "C:\Program Files\dotnet\dotnet.exe" "Nipco.Maintenance.Api.dll"

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\install-windows-service.ps1 `
        -AppPath C:\NIPCO\publish -Port 8080
#>
param(
    [Parameter(Mandatory = $true)][string]$AppPath,
    [int]$Port = 8080,
    [string]$TaskName = "NIPCO-Maintenance"
)

$ErrorActionPreference = "Stop"

$dll = Join-Path $AppPath "Nipco.Maintenance.Api.dll"
if (-not (Test-Path $dll)) { throw "$dll not found" }

$dotnet = (Get-Command dotnet).Source
$arguments = "`"$dll`" --urls http://0.0.0.0:$Port"

$action = New-ScheduledTaskAction -Execute $dotnet -Argument $arguments -WorkingDirectory $AppPath
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
    -Principal $principal -Description "NIPCO daily equipment control system" -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName
Write-Host "Task '$TaskName' registered and started. Open http://<server>:$Port" -ForegroundColor Green
Write-Host "Logs: Event Viewer > Applications, or run the app manually to see console output." -ForegroundColor Cyan
