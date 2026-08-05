param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [int]$MaxTags = 10,
    [int]$TitleMaxLength = 28,
    [switch]$AiAssisted,
    [switch]$Monetized,
    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is required to run the LOFTER package audit."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeScript = Join-Path $scriptDir "audit-package.mjs"
$argsList = @($nodeScript, "--path", $Path, "--maxTags", $MaxTags, "--titleMaxLength", $TitleMaxLength)

if ($AiAssisted) {
    $argsList += "--aiAssisted"
}

if ($Monetized) {
    $argsList += "--monetized"
}

if ($Json) {
    $argsList += "--json"
}

node @argsList
exit $LASTEXITCODE
