param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [string]$CharacterNames = "",
    [int]$TitleMaxLength = 28,
    [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeScript = Join-Path $scriptDir "audit-draft.mjs"

$argsList = @(
    $nodeScript,
    "--path", $Path,
    "--titleMaxLength", $TitleMaxLength
)

if (-not [string]::IsNullOrWhiteSpace($CharacterNames)) {
    $argsList += @("--characterNames", $CharacterNames)
}

if ($Json) {
    $argsList += "--json"
}

node @argsList
exit $LASTEXITCODE
