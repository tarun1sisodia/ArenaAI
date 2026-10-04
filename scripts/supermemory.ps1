# scripts/supermemory.ps1 — Native Windows PowerShell Supermemory Context CLI for SK Baghel Tour & Travels
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Command = "help",

    [Parameter(Position = 1)]
    [string]$Arg1,

    [Parameter(Position = 2)]
    [string]$Arg2
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

if (-not (Test-Path "$RootDir\.env")) {
    Write-Error "Error: .env file not found in $RootDir"
    exit 1
}

$envLine = Get-Content "$RootDir\.env" | Where-Object { $_ -match "^SUPERMEMORY_API_KEY=" } | Select-Object -First 1
if (-not $envLine) {
    Write-Error "Error: SUPERMEMORY_API_KEY not configured in .env"
    exit 1
}

$ApiKey = ($envLine -replace "^SUPERMEMORY_API_KEY=\s*", "").Trim().Trim('"').Trim("'")
if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    Write-Error "Error: SUPERMEMORY_API_KEY is empty in .env"
    exit 1
}

$env:SUPERMEMORY_API_KEY = $ApiKey
$Tag = "sk_baghel_travels"

switch ($Command.ToLower()) {
    "search" {
        if (-not $Arg1) {
            Write-Host 'Usage: .\scripts\supermemory.ps1 search <query> [threshold=0.25]'
            exit 1
        }
        $threshold = if ($Arg2) { $Arg2 } else { "0.25" }
        npx -y supermemory search --tag $Tag $Arg1 --threshold $threshold --json
    }
    "remember" {
        if (-not $Arg1) {
            Write-Host 'Usage: .\scripts\supermemory.ps1 remember "<Memory or Fact text>"'
            exit 1
        }
        npx -y supermemory remember --tag $Tag --static $Arg1 --json
    }
    "add" {
        if (-not $Arg1) {
            Write-Host 'Usage: .\scripts\supermemory.ps1 add <file-path> [title]'
            exit 1
        }
        if ($Arg2) {
            npx -y supermemory add --tag $Tag $Arg1 --title $Arg2 --json
        }
        else {
            npx -y supermemory add --tag $Tag $Arg1 --json
        }
    }
    "profile" {
        npx -y supermemory profile --tag $Tag --json
    }
    "whoami" {
        npx -y supermemory whoami
    }
    default {
        Write-Host 'SK Baghel Tour & Travels — Supermemory Context Helper (PowerShell)'
        Write-Host ''
        Write-Host 'Commands:'
        Write-Host '  .\scripts\supermemory.ps1 search <query> [threshold]   Fast semantic search in sk_baghel_travels'
        Write-Host '  .\scripts\supermemory.ps1 remember "<fact>"            Store permanent static memory'
        Write-Host '  .\scripts\supermemory.ps1 add <file> [title]            Ingest document into knowledge graph'
        Write-Host '  .\scripts\supermemory.ps1 profile                       View synthesized project profile'
        Write-Host '  .\scripts\supermemory.ps1 whoami                        Check Supermemory connection'
    }
}
