#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const result = {
    path: "",
    aiAssisted: false,
    monetized: false,
    maxTags: 10,
    titleMaxLength: 28,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--path") {
      result.path = argv[i + 1] || "";
      i += 1;
    } else if (arg === "--aiAssisted") {
      result.aiAssisted = true;
    } else if (arg === "--monetized") {
      result.monetized = true;
    } else if (arg === "--maxTags") {
      result.maxTags = Number.parseInt(argv[i + 1] || "10", 10);
      i += 1;
    } else if (arg === "--titleMaxLength") {
      result.titleMaxLength = Number.parseInt(argv[i + 1] || "28", 10);
      i += 1;
    } else if (arg === "--json") {
      result.json = true;
    }
  }

  return result;
}

function addFinding(findings, severity, rule, sample, message) {
  findings.push({ severity, rule, sample, message });
}

function getSection(content, heading) {
  const lines = content.split(/\r?\n/);
  const startPattern = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
  let start = -1;

  for (let i = 0; i < lines.length; i += 1) {
    if (startPattern.test(lines[i].trim())) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) return "";

  const collected = [];
  for (let i = start; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i].trim())) break;
    collected.push(lines[i]);
  }

  return collected.join("\n").trim();
}

function firstNonEmpty(section) {
  return section
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .find(Boolean) || "";
}

function normalizeTag(value) {
  return value.replace(/^#+|#+$/g, "").trim();
}

function extractTags(section) {
  const tags = new Set();
  const hashPattern = /#[^#\s,，、;；]+#?/g;

  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.replace(/^[-*]\s*/, "").trim();
    const value = line.includes(":") ? line.slice(line.indexOf(":") + 1) : line;

    const hashMatches = [...value.matchAll(hashPattern)].map((match) => normalizeTag(match[0]));
    if (hashMatches.length > 0) {
      for (const tag of hashMatches) {
        if (tag) tags.add(tag);
      }
      continue;
    }

    for (const part of value.split(/[,\u3001，;；\s]+/)) {
      const tag = normalizeTag(part);
      if (tag) tags.add(tag);
    }
  }

  return [...tags];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.path) {
    console.error("Missing required --path argument.");
    process.exit(1);
  }

  const packagePath = path.resolve(args.path);
  if (!fs.existsSync(packagePath)) {
    console.error(`Post package not found: ${packagePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(packagePath, "utf8");
  const findings = [];
  const title = firstNonEmpty(getSection(content, "Title"));
  const hook = firstNonEmpty(getSection(content, "Hook"));
  const summary = firstNonEmpty(getSection(content, "Summary"));
  const disclosure = getSection(content, "AI Disclosure");
  const tags = extractTags(getSection(content, "Tags"));
  const monetizationNotes = getSection(content, "Gift Or Monetization Notes");

  if (!title) {
    addFinding(findings, "warn", "missing-title", "", "Post package has no final title.");
  } else {
    if (title.length > args.titleMaxLength) {
      addFinding(findings, "warn", "title-length", title, "Title is longer than the configured limit.");
    }
    if (/：.{6,}/.test(title) || /[“"'「].+[”"'」]/.test(title)) {
      addFinding(findings, "warn", "title-dialogue", title, "Title looks like dialogue or plot summary.");
    }
  }

  if (!hook && !summary) {
    addFinding(findings, "warn", "missing-hook-summary", "", "Post package should include either a hook or a summary.");
  }

  if (tags.length === 0) {
    addFinding(findings, "warn", "missing-tags", "", "Post package has no usable tags.");
  } else if (tags.length > args.maxTags) {
    addFinding(
      findings,
      "warn",
      "tag-count",
      tags.join(", "),
      `Post package has more than ${args.maxTags} unique tags.`
    );
  }

  const hasAiTag = tags.some((tag) => /AI生成|AI辅助|AIGC|人工智能/i.test(tag));
  const hasAiDisclosure = /AI|人工智能|生成|辅助|创作说明/.test(disclosure);
  if (args.aiAssisted && !hasAiTag && !hasAiDisclosure) {
    addFinding(
      findings,
      "warn",
      "missing-ai-disclosure",
      "",
      "AI assistance was declared for the audit, but the package has no visible AI tag or disclosure note."
    );
  }

  if (args.monetized && !/礼物|赠礼|收益|付费|打赏|返礼|授权|风险/.test(monetizationNotes)) {
    addFinding(
      findings,
      "note",
      "missing-monetization-note",
      "",
      "Monetization was declared for the audit, but the package has no gift or monetization caution."
    );
  }

  if (/避审|过审|防封|绕过|反检测|去AI|洗AI|隐藏AI/.test(content)) {
    addFinding(
      findings,
      "warn",
      "evasion-language",
      "",
      "Package contains wording that suggests bypassing moderation, detection, or AI disclosure."
    );
  }

  const result = {
    path: packagePath,
    title,
    tags,
    findingCount: findings.length,
    findings,
  };

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(`Path: ${result.path}\n`);
  if (title) process.stdout.write(`Title: ${title}\n`);
  process.stdout.write(`Tags: ${tags.length}${tags.length ? ` (${tags.join(", ")})` : ""}\n`);
  process.stdout.write(`Findings: ${findings.length}\n`);
  for (const finding of findings) {
    process.stdout.write(`[${finding.severity.toUpperCase()}] ${finding.rule}: ${finding.message}\n`);
    if (finding.sample) process.stdout.write(`  sample: ${finding.sample}\n`);
  }
}

main();
