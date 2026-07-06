---
name: lofter-writer
description: Create and operate LOFTER-oriented fanfic projects. Use when the user wants to brainstorm, outline, draft, continue, revise, audit, tag, package, publish-check, or review fanfiction for LOFTER, especially for prompts involving fanfic, CP, IP, forum-style formats, post packages, tag strategy, AI disclosure, works-log, or command-style requests like ~new and ~tag.
---

# LOFTER Writer

## Overview

This skill builds LOFTER-ready fanfic projects with a repeatable workflow:

1. start or resume a work
2. route the story into the right format
3. draft in controllable chunks
4. package the final post for LOFTER
5. audit for obvious AI-smell and platform-fit issues

Use this skill for writing and packaging. Do not assume it should drive the LOFTER website directly unless the user explicitly asks for live browser actions.

Load the deeper references only when they help:

- [drafting-workflow.md](./references/drafting-workflow.md) for end-to-end planning, continuation, revision, and publish-pack flows
- [writing-mode-playbooks.md](./references/writing-mode-playbooks.md) when choosing or executing a concrete format such as forum thread, chat log, reaction, identity reveal, or serial
- [quality-rubric.md](./references/quality-rubric.md) for structured review or polishing
- [publishing-checklist.md](./references/publishing-checklist.md) before final publication packaging, tag strategy, AI disclosure, gifts, or monetization
- [compliance-and-boundaries.md](./references/compliance-and-boundaries.md) when the request touches AI disclosure, moderation, sensitive content, real people, copyright, or monetization

## Quick Start

When this skill is triggered, first decide whether the user is:

- starting a fresh work
- resuming an existing work
- asking for a specific artifact such as title, outline, body draft, tags, or a post package
- asking for review or post-mortem on existing data

If the workspace does not already have `works-log.md`, initialize the project structure first:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-dir>\scripts\init-project.ps1" -ProjectRoot .
```

If the user is starting a specific work, create a work folder at the same time:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-dir>\scripts\init-project.ps1" -ProjectRoot . -WorkSlug "my-work"
```

## Command Surface

Treat these as user-facing shortcuts. The user can say them literally, or ask for the same thing in plain language.

- `~new`: start or resume a work. If the user has no idea, offer 3 directions for the same IP/CP.
- `~route`: map the user's desired feeling to 1-3 candidate formats with tradeoffs.
- `~brief`: produce or update the story brief.
- `~outline`: produce a beat outline or chapter outline.
- `~draft`: write the requested section or one-shot body.
- `~continue`: continue from the latest saved progress without repeating setup.
- `~title`: generate title options that fit LOFTER discovery and tone.
- `~tag`: generate a tag set and explain why each group is there.
- `~post`: generate a LOFTER post package: title, summary, warnings, tags, and CTA.
- `~publish-check`: check a final package for tag fit, disclosure, sensitive content, rights, and monetization risk.
- `~audit`: run the rule-based draft audit before final packaging.
- `~review`: analyze outcome data from `works-log.md` and suggest the next move.
- `~adapt`: adapt the same core story into another platform voice only if the user asks.

## Workflow

### 1. Start Or Resume

For `~new`, collect or infer:

- `IP`
- `CP` or character focus
- core hook or situation
- desired feeling
- target length
- content boundaries or red lines

If the user is vague, do not ask for abstract literary terms. Ask or infer from "what feeling do you want" and "how fast should this hit".

If a work folder exists, read:

- `works-log.md`
- the current work's `story-brief.md`
- `outline.md`
- `draft.md`

Then continue instead of restarting the concept phase.

### 2. Route By Feeling, Not Jargon

Do not force the user to choose a format name unless they already know what they want.

Map reader intent to formats using [mode-routing.md](./references/mode-routing.md).
When the user has picked a format or needs execution guidance, use [writing-mode-playbooks.md](./references/writing-mode-playbooks.md).

Default behavior:

- offer 1 recommended format first
- offer up to 2 alternates
- explain the tradeoff in plain language

Example:

- "I want something sweet and easy to read" -> chat/forum/reaction format
- "I want emotional pull and inner tension" -> letter/diary/multi-POV
- "I want short, hot, fast engagement" -> forum/chat/segment-based format

### 3. Build The Story Brief

Write or update `story-brief.md` before large drafting. Keep it compact and concrete:

- premise
- canon anchors
- emotional promise
- conflict engine
- ending mode
- format choice
- do-not-write list

If canon details are uncertain, say so and keep the scene detail soft instead of inventing fake precision.

### 4. Draft In Chunks

Prefer controlled chunks over one huge dump.

Recommended order:

1. title directions
2. opening hook
3. outline
4. section-by-section draft
5. cleanup pass

Default drafting rules:

- keep the format consistent once chosen
- respect canon anchors from the brief
- keep dialogue attribution readable
- avoid over-explaining subtext
- vary sentence cadence and paragraph size

For long drafts, save progress into the current work folder after each major section.

### 5. Package For LOFTER

Generate a post package into `post-package.md` with:

- final title
- one-sentence hook
- short summary
- warnings or audience notes when needed
- tag set
- optional end CTA

Use [lofter-platform.md](./references/lofter-platform.md) for platform-fit constraints.
Use [publishing-checklist.md](./references/publishing-checklist.md) for final post packages, especially when the work is intended for live publication.
If the package raises safety, AI-labeling, monetization, or policy risk, also load [compliance-and-boundaries.md](./references/compliance-and-boundaries.md).

### 6. Audit Before Finalizing

Run the draft audit script before you present a draft as final:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-dir>\scripts\audit-draft.ps1" -Path ".\works\<slug>\draft.md"
```

If character names are known, pass them:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-dir>\scripts\audit-draft.ps1" -Path ".\works\<slug>\draft.md" -CharacterNames "NameA,NameB"
```

Use the output as a heuristic gate, not as absolute truth. Fix high-signal issues first, then re-run if the draft changed materially.

For rewrite guidance, use [quality-rules.md](./references/quality-rules.md).
For broader editorial review, use [quality-rubric.md](./references/quality-rubric.md).

For `~publish-check`, run the package audit on `post-package.md`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-dir>\scripts\audit-package.ps1" -Path ".\works\<slug>\post-package.md"
```

If AI materially assisted the work or monetization is being discussed, pass the relevant flags:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill-dir>\scripts\audit-package.ps1" -Path ".\works\<slug>\post-package.md" -AiAssisted -Monetized
```

## Tag Rules

Default LOFTER tag output should be grouped as:

- CP tags
- character tags
- IP tags
- format tags
- tone or setting tags

Keep the set deliberate. Do not spray unrelated tags for reach.

When the user asks for the latest official product rules, monetization thresholds, or platform policy changes, re-check live official pages instead of trusting cached knowledge.

## Review Loop

When the user asks for `~review`, read `works-log.md` and summarize:

- which format got the best response
- which tags repeat across better-performing works
- whether the opening or title pattern correlates with clicks
- one concrete next experiment

Do not invent analytics. If the file lacks numbers, say what is missing and what can still be inferred.

## Files In This Skill

- `references/lofter-platform.md`: official public platform facts and how to use them
- `references/mode-routing.md`: feeling-to-format routing
- `references/quality-rules.md`: anti-AI-smell and cleanup guidance
- `references/drafting-workflow.md`: full writing workflow from intake to publish pack
- `references/writing-mode-playbooks.md`: format-specific execution guidance
- `references/quality-rubric.md`: structured review and revision rubric
- `references/publishing-checklist.md`: final publication package checklist
- `references/compliance-and-boundaries.md`: publication safety, AI disclosure, and policy boundaries
- `scripts/init-project.ps1`: bootstrap project files and work folders
- `scripts/audit-draft.ps1`: rule-based draft audit
- `scripts/audit-package.ps1`: rule-based LOFTER post package audit
- `assets/templates/`: markdown templates copied by the init script

## Boundaries

- This skill focuses on text-first LOFTER workflows.
- Do not promise current monetization thresholds unless verified live.
- Do not treat the rule-based audit as a literary judge.
- Do not switch IP/CP focus mid-project unless the user explicitly wants a pivot.
- Do not help bypass moderation, hide AI assistance, or mislead readers about generated content.
