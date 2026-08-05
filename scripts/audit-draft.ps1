param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [string]$PostPackagePath = "",
    [string]$CharacterNames = "",
    [int]$TitleMaxLength = 28,
    [switch]$AiAssisted,
    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is required to run the LOFTER draft audit."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeScript = Join-Path $scriptDir "audit-draft.mjs"
$argsList = @($nodeScript, "--path", $Path, "--titleMaxLength", $TitleMaxLength)

if (-not [string]::IsNullOrWhiteSpace($PostPackagePath)) {
    $argsList += @("--postPackagePath", $PostPackagePath)
}

if (-not [string]::IsNullOrWhiteSpace($CharacterNames)) {
    $argsList += @("--characterNames", $CharacterNames)
}

if ($AiAssisted) {
    $argsList += "--aiAssisted"
}

if ($Json) {
    $argsList += "--json"
}

node @argsList
exit $LASTEXITCODE
