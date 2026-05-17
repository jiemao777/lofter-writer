#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const result = {
    path: "",
    characterNames: "",
    titleMaxLength: 28,
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--path") {
      result.path = argv[i + 1] || "";
      i += 1;
    } else if (arg === "--characterNames") {
      result.characterNames = argv[i + 1] || "";
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

function addFinding(findings, severity, rule, line, sample, message) {
  findings.push({ severity, rule, line, sample, message });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.path) {
    console.error("Missing required --path argument.");
    process.exit(1);
  }

  const draftPath = path.resolve(args.path);
  if (!fs.existsSync(draftPath)) {
    console.error(`Draft file not found: ${draftPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(draftPath, "utf8");
  const lines = content.split(/\r?\n/);
  const findings = [];

  let title = "";
  let titleLine = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed.length > 0) {
      title = trimmed.replace(/^#+\s*/, "");
      titleLine = i + 1;
      break;
    }
  }

  if (title) {
    if (title.length > args.titleMaxLength) {
      addFinding(
        findings,
        "warn",
        "title-length",
        titleLine,
        title,
        "Title is longer than the configured limit."
      );
    }

    if (/：.{6,}/.test(title) || /[“"'「].+[”"'」]/.test(title)) {
      addFinding(
        findings,
        "warn",
        "title-dialogue",
        titleLine,
        title,
        "Title looks like dialogue or plot summary."
      );
    }
  }

  const bannedPhrases = [
    "粉粉嫩嫩",
    "邪魅一笑",
    "小脸小嘴",
    "嘴角勾起一抹弧度",
    "眼底闪过一丝",
    "空气仿佛凝固",
  ];

  const pseudoPrecisionPattern =
    /第[0-9一二三四五六七八九十]+(根|个)(指关节|手指|肋骨|神经)|无名指的第[0-9一二三四五六七八九十]+个指关节/;
  const essayTransitionPattern = /^(首先|其次|最后|总之)[，,:：]/;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    for (const phrase of bannedPhrases) {
      if (line.includes(phrase)) {
        addFinding(
          findings,
          "warn",
          "cliche-phrase",
          i + 1,
          phrase,
          "Contains a high-risk stock phrase."
        );
      }
    }

    if (pseudoPrecisionPattern.test(line)) {
      addFinding(
        findings,
        "warn",
        "pseudo-precision",
        i + 1,
        line.trim(),
        "Contains suspiciously precise anatomy wording."
      );
    }

    if (essayTransitionPattern.test(line.trim())) {
      addFinding(
        findings,
        "note",
        "essay-transition",
        i + 1,
        line.trim(),
        "Reads like explanatory prose instead of scene prose."
      );
    }
  }

  if (args.characterNames.trim()) {
    const allow = new Set(
      args.characterNames
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    );
    const seen = new Set();
    const dialogueNamePattern = /([\u4e00-\u9fa5A-Za-z0-9]{2,8})(说|问|道|喊|答)/g;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      let match;
      while ((match = dialogueNamePattern.exec(line)) !== null) {
        const name = match[1];
        if (!allow.has(name) && !seen.has(name)) {
          seen.add(name);
          addFinding(
            findings,
            "note",
            "name-check",
            i + 1,
            name,
            "Name appears in dialogue attribution but is not in the allow-list."
          );
        }
      }
    }
  }

  const result = {
    path: draftPath,
    title,
    findingCount: findings.length,
    findings,
  };

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(`Path: ${result.path}\n`);
  if (title) {
    process.stdout.write(`Title: ${title}\n`);
  }
  process.stdout.write(`Findings: ${findings.length}\n`);
  for (const finding of findings) {
    process.stdout.write(
      `[${finding.severity.toUpperCase()}] line ${finding.line} ${finding.rule}: ${finding.message}\n`
    );
    process.stdout.write(`  sample: ${finding.sample}\n`);
  }
}

main();
