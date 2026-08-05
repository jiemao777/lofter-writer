# LOFTER Postsmith

`lofter-writer` is a Codex skill for planning, drafting, continuing, reviewing, and packaging Chinese LOFTER fanwork and original posts.

It combines format playbooks, long-form continuity memory, LOFTER publishing guidance, transparent AI disclosure, deterministic linting, and a model-based quality review.

## Capabilities

- Brainstorm, outline, draft, continue, and revise short posts or serial fiction
- Route by reader feeling into forum, chat, reaction, identity reveal, daily, comedy, canon-drama, or serial formats
- Track canon facts, character voice, timeline, knowledge state, and unresolved hooks
- Create titles, summaries, warnings, collections, tags, disclosures, and discussion prompts
- Review comparable performance snapshots without inventing analytics or claiming causality
- Check placeholders, duplicate paragraphs, title/tag packaging, AI disclosure, rights, and monetization cautions

## Commands

| Command | Purpose |
| --- | --- |
| `~new` | Start or resume a work |
| `~route` | Recommend a format from the desired reader feeling |
| `~brief` | Build or update the story brief |
| `~outline` | Create scene beats or a chapter plan |
| `~draft` | Draft the requested section |
| `~continue` | Continue from saved continuity |
| `~title` | Generate focused title options |
| `~tag` | Build an accurate, compact tag set |
| `~post` | Create the complete LOFTER publish pack |
| `~audit` | Run deterministic lint and literary review |
| `~publish-check` | Check disclosure, tags, rights, gifts, and monetization risk |
| `~review` | Compare like-aged performance snapshots |
| `~adapt` | Adapt the same work to another platform when requested |

## Project Structure

```text
canon-bible.md
character-voice.md
works-log.md
works/<slug>/
  story-brief.md
  outline.md
  continuity.md
  draft.md
  post-package.md
```

Initialize a project:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\init-project.ps1" -ProjectRoot "." -WorkSlug "my-work" -ProjectTitle "collection-name" -Ip "source-work" -Cp "ship-or-focus"
```

Audit a draft and its publish pack:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\audit-draft.ps1" -Path ".\works\my-work\draft.md" -PostPackagePath ".\works\my-work\post-package.md" -AiAssisted -Json
```

Audit only a final publish pack:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\audit-package.ps1" -Path ".\works\my-work\post-package.md" -AiAssisted -Monetized -Json
```

The audit scripts are deterministic linters, not AI detectors or literary judges. Use `references/quality-rubric.md` and `references/publishing-checklist.md` for the final judgment pass.
