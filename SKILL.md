---
name: lofter-writer
description: Chinese LOFTER writing and publishing assistant for fanwork and original posts. Use when the user asks to brainstorm, outline, draft, continue, revise, polish, adapt, audit, title, tag, package, publish, or review LOFTER content; requests 同人文、原创、CP、论坛体、聊天体、观影体、掉马、甜文、虐文、喜剧、连载、续写、标题、标签、发布包、作品复盘; or needs help with characterization, canon continuity, pacing, platform fit, AI disclosure, copyright, or sensitive-content checks. Do not use to evade moderation or AI detection, conceal required labels, impersonate real people, scrape private content, or create illegal, exploitative, or sexual content involving minors.
---

# LOFTER Writer

Create publication-ready Chinese LOFTER posts while preserving character voice, continuity, fandom etiquette, and platform boundaries.

## Core Rules

- Prefer Chinese output unless the user asks otherwise.
- Collect only information needed for the next useful step. Infer low-risk details and mark uncertainty instead of interrogating the user.
- Treat canon facts, user boundaries, relationship direction, and fandom tag customs as constraints.
- Do not promise traffic, income, approval, or detection outcomes.
- Reframe requests to remove "AI flavor" as editorial specificity and voice work, never as detection evasion.
- Do not operate the LOFTER website unless the user explicitly requests browser actions.

## Workflow

1. Identify the requested artifact: idea, route, brief, outline, draft, continuation, revision, publish pack, audit, tag strategy, or performance review.
2. Collect or infer IP/world, characters or CP, relationship direction, desired feeling, target length, canon sensitivity, rating/boundaries, and posting goal.
3. Read `references/drafting-workflow.md` for multi-step writing work. Read `references/writing-mode-playbooks.md` when selecting or executing a format.
4. For long or repeated work, initialize a project and read the existing memory files before writing. For a short low-risk request, draft directly.
5. Draft or revise using `references/quality-rubric.md`. Preserve deliberate roughness, humor, hesitation, and character-specific avoidance.
6. Build `post-package.md` using `references/lofter-platform-notes.md`.
7. Run the deterministic audit script. Then perform the model-based quality and compliance pass; the script is a linter, not a literary judge or AI detector.
8. Save changed continuity, unresolved hooks, and performance snapshots when the project is persistent.

## Commands

Treat these as optional shortcuts; equivalent natural-language requests work the same way.

- `~new`: start or resume a work; offer three distinct directions if the user has no premise.
- `~route`: recommend one format and up to two alternatives with tradeoffs.
- `~brief`: create or update the story brief and constraints.
- `~outline`: create scene beats or a chapter plan.
- `~draft`: write the requested section or complete short post.
- `~continue`: continue from saved state without repeating setup.
- `~title`: provide focused title options with different tones.
- `~tag`: provide a compact, etiquette-aware tag set.
- `~post`: create the full LOFTER publish pack.
- `~audit`: run deterministic lint, then review with the quality rubric.
- `~review`: compare like-aged performance snapshots and propose one controlled experiment.
- `~adapt`: adapt the work to another platform only when explicitly requested.

## Project Memory

For multi-chapter or repeated work, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-dir>\scripts\init-project.ps1" -ProjectRoot "." -WorkSlug "my-work" -ProjectTitle "collection-name" -Ip "source-work" -Cp "ship-or-focus"
```

Read project memory in this order before continuing:

1. `canon-bible.md`
2. `character-voice.md`
3. `works-log.md`
4. `works/<slug>/story-brief.md`
5. `works/<slug>/continuity.md`
6. `works/<slug>/outline.md`
7. `works/<slug>/draft.md`

Update only facts established by the user, canon sources, or the current draft. Mark uncertain details instead of converting guesses into canon.

## Audit

Run the audit before presenting publication-ready output:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-dir>\scripts\audit-draft.ps1" -Path ".\works\<slug>\draft.md" -PostPackagePath ".\works\<slug>\post-package.md" -CharacterNames "NameA,NameB" -AiAssisted -Json
```

Omit `-AiAssisted` only when AI did not materially assist the publishable content. Fix `error` findings before publication, inspect `warn` findings in context, and treat `note` findings as prompts for human judgment.

## Load References

- Read `references/drafting-workflow.md` for planning, drafting, continuation, revision, or a full publish pack.
- Read `references/writing-mode-playbooks.md` for forum, chat, viewing/reaction, identity reveal, daily sweet story, comedy, canon drama, or serial modes.
- Read `references/quality-rubric.md` for review, revision, characterization, pacing, dialogue, scene grounding, and editorial specificity.
- Read `references/lofter-platform-notes.md` for tags, titles, collections, interaction, gifts, timing, or platform-specific publishing.
- Read `references/compliance-and-boundaries.md` for AI disclosure, platform rules, minors, real people, copyright, monetization, or sensitive content.
- Read `references/review-loop.md` for `~review`, works-log analysis, and controlled posting experiments.
