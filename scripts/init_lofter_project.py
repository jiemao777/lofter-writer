#!/usr/bin/env python3
"""Initialize a small LOFTER writing project folder."""

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path


def safe_name(value: str) -> str:
    keep = []
    for ch in value.strip():
        if ch.isalnum() or ch in "-_ ":
            keep.append(ch)
    cleaned = "".join(keep).strip().replace(" ", "-")
    return cleaned or "lofter-project"


def write_if_missing(path: Path, content: str) -> bool:
    if path.exists():
        return False
    path.write_text(content, encoding="utf-8", newline="\n")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Create LOFTER writing project files.")
    parser.add_argument("--title", required=True, help="Project or collection title")
    parser.add_argument("--ip", default="", help="Source IP or original world")
    parser.add_argument("--cp", default="", help="Ship, relationship, or character focus")
    parser.add_argument("--mode", default="", help="Writing mode, such as forum-thread or serial")
    parser.add_argument("--output", default=".", help="Output parent directory")
    args = parser.parse_args()

    root = Path(args.output).expanduser().resolve() / safe_name(args.title)
    root.mkdir(parents=True, exist_ok=True)
    for child in ["outlines", "drafts", "publish-packs", "notes"]:
        (root / child).mkdir(exist_ok=True)

    today = date.today().isoformat()
    brief = f"""# {args.title}

Created: {today}

## Brief

- IP/world: {args.ip or "TBD"}
- CP/characters: {args.cp or "TBD"}
- Writing mode: {args.mode or "TBD"}
- Rating/boundaries: TBD
- Canon sensitivity: TBD
- Target length: TBD
- Publishing goal: TBD

## Continuity Notes

- Names/pronouns:
- Timeline:
- Relationship status:
- Important props/locations:
- Unresolved hooks:
"""

    log = """# Works Log

| ID | Title | Status | Mode | Words | Tags | Last update | Next step |
| --- | --- | --- | --- | ---: | --- | --- | --- |
"""

    write_if_missing(root / "project-brief.md", brief)
    write_if_missing(root / "works-log.md", log)
    write_if_missing(root / "notes" / "tag-rules.md", "# Tag Rules\n\n- Known fandom tag customs:\n- Tags to avoid:\n")

    print(root)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
