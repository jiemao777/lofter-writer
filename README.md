# LOFTER Writer

`lofter-writer` is a Codex skill for planning, drafting, reviewing, and packaging LOFTER-oriented fanfic projects.

It is built for text-first workflows: help the writer choose a format, keep a work organized across drafts, package a publish-ready post, and run a lightweight quality check before final delivery.

## What It Covers

- Story setup and continuation for fanfic projects
- Feeling-to-format routing for chat, forum, reaction, diary, serial, and related forms
- Story briefs, outlines, chunked drafting, and post packages
- LOFTER-aware titles, summaries, warnings, and tag strategy
- Draft review, anti-generic cleanup, and publication-boundary checks

## Command Surface

| Command | Purpose |
| --- | --- |
| `~new` | Start or resume a work |
| `~route` | Choose a format from the desired reader feeling |
| `~brief` | Build or update the story brief |
| `~outline` | Create a beat or chapter outline |
| `~draft` | Draft the requested section |
| `~continue` | Continue from saved progress |
| `~title` | Generate title options |
| `~tag` | Build a deliberate tag set |
| `~post` | Package the final LOFTER post |
| `~audit` | Run the rule-based draft audit |
| `~review` | Review outcome data from `works-log.md` |
| `~adapt` | Adapt the same story core to another platform voice |

## Included Resources

```text
agents/
assets/templates/
references/
scripts/
SKILL.md
```

- `SKILL.md` keeps the core workflow concise.
- `references/` holds deeper guidance for platform rules, formats, quality, workflow, and compliance.
- `assets/templates/` provides reusable markdown starters for projects and works.
- `scripts/` includes project initialization and a lightweight draft audit.

## Quick Start

Initialize a writing workspace:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\init-project.ps1" -ProjectRoot .
```

Start a named work:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\init-project.ps1" -ProjectRoot . -WorkSlug "my-work"
```

Audit a draft before final packaging:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\audit-draft.ps1" -Path ".\works\my-work\draft.md"
```

## Design Notes

- Keep platform advice conservative when rules may change.
- Treat the audit script as a heuristic gate, not a literary judge.
- Prefer accurate tags and transparent AI disclosure over traffic tricks.
- Use the deeper references only when they help, so the core skill stays compact.
