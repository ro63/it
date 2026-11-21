<#
.SYNOPSIS
    One-command build of the NIPCO install package, including automatic
    installation of the build prerequisites (Node.js 20 and the .NET 10 SDK)
    when they are missing.

.DESCRIPTION
    Requires Windows and an internet connection the first time.
    Uses winget when available; otherwise prints the download links.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File deploy\build-package.ps1

.EXAMPLE
    # bundle the .NET runtime too, so the server needs no runtime installed
    powershell -ExecutionPolicy Bypass -File deploy\build-package.ps1 -SelfContained
#>
param(
    [string]$OutputPath = (Join-Path $PSScriptRoot "..\publish"),
    [switch]$SelfContained
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

function Test-Winget { return [bool](Get-Command winget -ErrorAction SilentlyContinue) }

function Install-Tool([string]$id, [string]$name, [string]$url) {
    if (-not (Test-Winget)) {
        throw "$name is missing and winget is not available. Install it manually: $url"
    }
    Write-Host "Installing $name ..." -ForegroundColor Cyan
    winget install --id $id --exact --accept-source-agreements --accept-package-agreements --silent
    if ($LASTEXITCODE -ne 0) { throw "Automatic installation of $name failed. Install manually: $url" }
    Write-Host "$name installed. You may need to open a new terminal for PATH changes." -ForegroundColor Green
}

# ---------------------------------------------------------------- Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Install-Tool "OpenJS.NodeJS.LTS" "Node.js LTS" "https://nodejs.org"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + `
                [System.Environment]::GetEnvironmentVariable("Path", "User")
}
$nodeVersion = (& node --version) 2>$null
if (-not $nodeVersion) { throw "Node.js is still not available. Close this window, open a new one and run this script again." }
Write-Host "Node.js $nodeVersion" -ForegroundColor Gray

# ------------------------------------------------------------------- .NET
$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
$sdkOk = $false
if ($dotnet) {
    $sdks = (& dotnet --list-sdks) 2>$null
    $sdkOk = [bool]($sdks | Where-Object { $_ -match '^10\.' })
}
if (-not $sdkOk) {
    Install-Tool "Microsoft.DotNet.SDK.10" ".NET SDK 10" "https://dotnet.microsoft.com/download"
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + `
                [System.Environment]::GetEnvironmentVariable("Path", "User")
    $sdks = (& dotnet --list-sdks) 2>$null
    if (-not ($sdks | Where-Object { $_ -match '^10\.' })) {
        throw ".NET SDK 10 is still not available. Close this window, open a new one and run this script again."
    }
}
Write-Host ".NET SDK 10 ready." -ForegroundColor Gray

# ---------------------------------------------------------------- publish
Write-Host ""
Write-Host "Building the package into $OutputPath ..." -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "publish.ps1") -OutputPath $OutputPath -SelfContained:$SelfContained
if ($LASTEXITCODE -ne 0) { throw "publish.ps1 failed" }

# ------------------------------------------------------------------- zip
$zip = "$OutputPath.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Write-Host "Creating $zip ..." -ForegroundColor Cyan
Compress-Archive -Path (Join-Path $OutputPath '*') -DestinationPath $zip -CompressionLevel Optimal

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "  Folder : $OutputPath"
Write-Host "  Zip    : $zip  (this is what you copy to the server)"
