param(
    [string]$ProjectRoot = ".",
    [string]$WorkSlug = "",
    [string]$ProjectTitle = "",
    [string]$Ip = "",
    [string]$Cp = "",
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath {
    param([string]$PathValue)

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return [System.IO.Path]::GetFullPath($PathValue)
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $PathValue))
}

function Normalize-Slug {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ""
    }

    $clean = $Value.Trim()
    $clean = [regex]::Replace($clean, '[<>:"/\\|?*]+', '-')
    $clean = [regex]::Replace($clean, '\s+', '-')
    $clean = $clean.Trim('-')

    if ([string]::IsNullOrWhiteSpace($clean)) {
        throw "WorkSlug became empty after normalization."
    }

    return $clean
}

function Write-TemplateFile {
    param(
        [string]$TemplatePath,
        [string]$DestinationPath,
        [hashtable]$Replacements
    )

    if ((Test-Path -LiteralPath $DestinationPath) -and (-not $Force)) {
        return [pscustomobject]@{ path = $DestinationPath; written = $false }
    }

    $content = Get-Content -LiteralPath $TemplatePath -Raw -Encoding UTF8
    foreach ($key in $Replacements.Keys) {
        $content = $content.Replace($key, [string]$Replacements[$key])
    }

    Set-Content -LiteralPath $DestinationPath -Value $content -Encoding UTF8
    return [pscustomobject]@{ path = $DestinationPath; written = $true }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillDir = Split-Path -Parent $scriptDir
$templateDir = Join-Path $skillDir "assets\templates"
$root = Resolve-AbsolutePath $ProjectRoot
$slug = Normalize-Slug $WorkSlug

New-Item -ItemType Directory -Force -Path $root | Out-Null
foreach ($folderName in @("works", "exports", "research")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $root $folderName) | Out-Null
}

if ([string]::IsNullOrWhiteSpace($ProjectTitle)) {
    $ProjectTitle = Split-Path -Leaf $root
}

$replacements = @{
    "{{PROJECT_TITLE}}" = $ProjectTitle
    "{{IP}}" = if ([string]::IsNullOrWhiteSpace($Ip)) { "TBD" } else { $Ip }
    "{{CP}}" = if ([string]::IsNullOrWhiteSpace($Cp)) { "TBD" } else { $Cp }
    "{{WORK_SLUG}}" = if ([string]::IsNullOrWhiteSpace($slug)) { "TBD" } else { $slug }
}

$written = [System.Collections.Generic.List[string]]::new()
$skipped = [System.Collections.Generic.List[string]]::new()

foreach ($templateName in @("works-log.md", "canon-bible.md", "character-voice.md")) {
    $result = Write-TemplateFile `
        -TemplatePath (Join-Path $templateDir $templateName) `
        -DestinationPath (Join-Path $root $templateName) `
        -Replacements $replacements

    if ($result.written) { $written.Add($result.path) } else { $skipped.Add($result.path) }
}

if (-not [string]::IsNullOrWhiteSpace($slug)) {
    $workDir = Join-Path (Join-Path $root "works") $slug
    New-Item -ItemType Directory -Force -Path $workDir | Out-Null

    foreach ($templateName in @("story-brief.md", "outline.md", "continuity.md", "draft.md", "post-package.md")) {
        $result = Write-TemplateFile `
            -TemplatePath (Join-Path $templateDir $templateName) `
            -DestinationPath (Join-Path $workDir $templateName) `
            -Replacements $replacements

        if ($result.written) { $written.Add($result.path) } else { $skipped.Add($result.path) }
    }
}

[pscustomobject]@{
    projectRoot = $root
    workSlug = if ([string]::IsNullOrWhiteSpace($slug)) { $null } else { $slug }
    created = $written
    skipped = $skipped
} | ConvertTo-Json -Depth 4
