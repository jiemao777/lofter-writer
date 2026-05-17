param(
    [string]$ProjectRoot = ".",
    [string]$WorkSlug = "",
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

function Set-TemplateFile {
    param(
        [string]$TemplatePath,
        [string]$DestinationPath,
        [hashtable]$Replacements
    )

    if ((Test-Path -LiteralPath $DestinationPath) -and (-not $Force)) {
        return
    }

    $content = Get-Content -LiteralPath $TemplatePath -Raw
    foreach ($key in $Replacements.Keys) {
        $content = $content.Replace($key, $Replacements[$key])
    }
    Set-Content -LiteralPath $DestinationPath -Value $content -Encoding UTF8
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

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$skillDir = Split-Path -Parent $scriptDir
$templateDir = Join-Path $skillDir "assets\templates"
$root = Resolve-AbsolutePath $ProjectRoot

New-Item -ItemType Directory -Force -Path $root | Out-Null

$folders = @(
    (Join-Path $root "works"),
    (Join-Path $root "exports"),
    (Join-Path $root "research")
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
}

Set-TemplateFile `
    -TemplatePath (Join-Path $templateDir "works-log.md") `
    -DestinationPath (Join-Path $root "works-log.md") `
    -Replacements @{}

$created = @()
$created += (Join-Path $root "works-log.md")

if (-not [string]::IsNullOrWhiteSpace($WorkSlug)) {
    $slug = Normalize-Slug $WorkSlug
    $workDir = Join-Path (Join-Path $root "works") $slug
    New-Item -ItemType Directory -Force -Path $workDir | Out-Null

    $replacements = @{
        "{{WORK_SLUG}}" = $slug
    }

    $templateMap = @{
        "story-brief.md" = "story-brief.md"
        "outline.md" = "outline.md"
        "draft.md" = "draft.md"
        "post-package.md" = "post-package.md"
    }

    foreach ($templateName in $templateMap.Keys) {
        $destinationName = $templateMap[$templateName]
        $destinationPath = Join-Path $workDir $destinationName
        Set-TemplateFile `
            -TemplatePath (Join-Path $templateDir $templateName) `
            -DestinationPath $destinationPath `
            -Replacements $replacements
        $created += $destinationPath
    }
}

[pscustomobject]@{
    projectRoot = $root
    workSlug = if ([string]::IsNullOrWhiteSpace($WorkSlug)) { $null } else { $slug }
    created = $created
} | ConvertTo-Json -Depth 4
