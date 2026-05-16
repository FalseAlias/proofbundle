# ProofBundle Windows Launcher
# Identity: proofbundle-windows-launcher-v1.0
# Standing: blocked_not_release_green

param(
    [switch]$Verify,
    [switch]$Conformance,
    [string]$BundleFile
)

$ErrorActionPreference = "Stop"
$AppUrl = "https://falsealias.github.io/proofbundle/"
$RepoRoot = Split-Path -Parent $PSScriptRoot | Split-Path -Parent

function Launch-BrowserApp {
    Write-Host "Launching ProofBundle Browser Verifier..." -ForegroundColor Cyan
    Start-Process $AppUrl
}

function Run-ConformanceCheck {
    Write-Host "Running conformance verification..." -ForegroundColor Cyan
    $VectorsFile = Join-Path $RepoRoot "conformance" "vectors_v1.json"
    if (Test-Path $VectorsFile) {
        Write-Host "Conformance vectors found: $VectorsFile" -ForegroundColor Green
        Write-Host "Use the browser verifier to load and validate these vectors." -ForegroundColor Yellow
    } else {
        Write-Warning "Conformance vectors not found at expected path."
    }
}

function Verify-BundleFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        Write-Error "Bundle file not found: $Path"
        return
    }
    $json = Get-Content $Path -Raw | ConvertFrom-Json
    Write-Host "Bundle loaded. Keys: $($json.PSObject.Properties.Name -join ', ')" -ForegroundColor Green
    Write-Host "Open the browser verifier and paste this bundle to validate." -ForegroundColor Yellow
}

Write-Host @"
========================================
  ProofBundle v1.0.0-alpha.2
  Public Alpha - Not Release-Green
========================================
"@ -ForegroundColor Cyan

if ($Conformance) {
    Run-ConformanceCheck
} elseif ($BundleFile) {
    Verify-BundleFile -Path $BundleFile
} else {
    Launch-BrowserApp
}

Write-Host "`nStanding: blocked_not_release_green" -ForegroundColor DarkGray
Write-Host "189 canonical proof audit exceptions remain." -ForegroundColor DarkGray
