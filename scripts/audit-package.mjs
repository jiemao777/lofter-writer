#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function requireValue(argv, index, argumentName) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${argumentName}.`);
  }
  return value;
}

export function parseArgs(argv) {
  const result = {
    path: "",
    aiAssisted: false,
    monetized: false,
    maxTags: 10,
    titleMaxLength: 28,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--path") {
      result.path = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--aiAssisted") {
      result.aiAssisted = true;
    } else if (arg === "--monetized") {
      result.monetized = true;
    } else if (arg === "--maxTags") {
      result.maxTags = Number.parseInt(requireValue(argv, index, arg), 10);
      index += 1;
    } else if (arg === "--titleMaxLength") {
      result.titleMaxLength = Number.parseInt(requireValue(argv, index, arg), 10);
      index += 1;
    } else if (arg === "--json") {
      result.json = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!result.path) {
    throw new Error("Missing required --path argument.");
  }
  if (!Number.isInteger(result.maxTags) || result.maxTags < 1) {
    throw new Error("--maxTags must be a positive integer.");
  }
  if (!Number.isInteger(result.titleMaxLength) || result.titleMaxLength < 1) {
    throw new Error("--titleMaxLength must be a positive integer.");
  }

  return result;
}

function getSection(lines, heading) {
  const wanted = heading.trim().toLowerCase();
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match || match[2].trim().toLowerCase() !== wanted) {
      continue;
    }

    const level = match[1].length;
    let end = lines.length;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor].match(/^(#{1,6})\s+/);
      if (next && next[1].length <= level) {
        end = cursor;
        break;
      }
    }
    return { start: index + 1, lines: lines.slice(index + 1, end) };
  }
  return null;
}

function cleanListValue(value) {
  return value.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, "").trim();
}

function firstValue(section) {
  if (!section) {
    return null;
  }
  for (let offset = 0; offset < section.lines.length; offset += 1) {
    const value = cleanListValue(section.lines[offset]);
    if (value) {
      return { value, line: section.start + offset + 1 };
    }
  }
  return null;
}

function extractTags(section) {
  if (!section) {
    return [];
  }
  const text = section.lines.join("\n");
  const hashTags = [...text.matchAll(/#([^#\r\n]+)#/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  if (hashTags.length > 0) {
    return [...new Set(hashTags)];
  }

  const tags = [];
  for (const rawLine of section.lines) {
    const line = cleanListValue(rawLine);
    const separator = line.search(/[：:]/);
    const value = separator >= 0 ? line.slice(separator + 1) : line;
    for (const part of value.split(/[、，,;；]/)) {
      const tag = part.trim().replace(/^#|#$/g, "");
      if (tag && !/^(?:TBD|TODO|None|N\/A)$/i.test(tag)) {
        tags.push(tag);
      }
    }
  }
  return [...new Set(tags)];
}

function addFinding(findings, severity, rule, line, sample, message) {
  findings.push({ severity, rule, line, sample, message });
}

function scanPlaceholders(lines, findings) {
  const pattern = /{{[^}\n]+}}|\b(?:TBD|TODO)\b/g;
  for (let index = 0; index < lines.length; index += 1) {
    const matches = [...lines[index].matchAll(pattern)];
    if (matches.length > 0) {
      addFinding(
        findings,
        "error",
        "placeholder",
        index + 1,
        matches.map((match) => match[0]).join(", "),
        "发布包仍包含未完成的占位内容。"
      );
    }
  }
}

export function auditPackage(options) {
  const packagePath = path.resolve(options.path);
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Post package not found: ${packagePath}`);
  }

  const content = fs.readFileSync(packagePath, "utf8").replace(/^\uFEFF/, "");
  const lines = content.split(/\r?\n/);
  const findings = [];
  scanPlaceholders(lines, findings);

  const titleValue = firstValue(getSection(lines, "Title"));
  const hookValue = firstValue(getSection(lines, "Hook"));
  const summaryValue = firstValue(getSection(lines, "Summary"));
  const disclosure = getSection(lines, "AI Disclosure");
  const rights = getSection(lines, "Rights And Sources");
  const monetization = getSection(lines, "Gift Or Monetization Notes");
  const tagsSection = getSection(lines, "Tags");
  const tags = extractTags(tagsSection);
  let title = "";

  if (!titleValue || /^(?:TBD|TODO)$/i.test(titleValue.value)) {
    addFinding(findings, "error", "title-missing", titleValue?.line || 1, titleValue?.value || "", "发布包缺少最终标题。");
  } else {
    title = titleValue.value;
    if (Array.from(title).length > options.titleMaxLength) {
      addFinding(findings, "warn", "title-length", titleValue.line, title, "标题超过配置长度，请确认它仍然清晰易读。");
    }
    if (/：.{6,}/.test(title) || /[“"'「].+[”"'」]/.test(title)) {
      addFinding(findings, "warn", "title-dialogue", titleValue.line, title, "标题像长对白或剧情摘要，请确认这是有意选择。");
    }
  }

  const hookMissing = !hookValue || /^(?:TBD|TODO)$/i.test(hookValue.value);
  const summaryMissing = !summaryValue || /^(?:TBD|TODO)$/i.test(summaryValue.value);
  if (hookMissing && summaryMissing) {
    addFinding(findings, "error", "hook-summary-missing", 1, "", "发布包至少需要一个有效的 hook 或 summary。");
  }

  if (tags.length === 0) {
    addFinding(findings, "error", "tags-missing", tagsSection?.start || 1, "", "发布包没有可识别的标签。");
  } else if (tags.length > options.maxTags) {
    addFinding(findings, "warn", "tag-count", tagsSection?.start || 1, tags.join(", "), `标签超过 ${options.maxTags} 个，请检查是否存在无关或重复标签。`);
  }

  const disclosureText = disclosure?.lines.join("\n") || "";
  const hasAiTag = tags.some((tag) => /AI生成|AI辅助|AIGC|人工智能/i.test(tag));
  const hasAiDisclosure = /#AI(?:生成|辅助)#|AI(?:生成|辅助)|人工智能(?:生成|辅助)/i.test(disclosureText);
  if (options.aiAssisted && !hasAiTag && !hasAiDisclosure) {
    addFinding(findings, "error", "ai-disclosure-missing", disclosure?.start || 1, "", "已声明使用 AI 辅助，但发布包缺少可见的 AI 标注或说明。");
  }

  if (options.monetized) {
    const monetizationText = monetization?.lines.join("\n") || "";
    const rightsText = rights?.lines.join("\n") || "";
    if (!/礼物|赠礼|收益|付费|打赏|返礼|授权|风险|monet/i.test(monetizationText)) {
      addFinding(findings, "warn", "monetization-note-missing", monetization?.start || 1, "", "涉及变现，但发布包缺少礼物、付费或规则风险说明。");
    }
    if (!/授权|来源|版权|原作|许可|rights?|source|permission/i.test(rightsText)) {
      addFinding(findings, "warn", "rights-note-missing", rights?.start || 1, "", "涉及变现，但发布包缺少权利来源或授权说明。");
    }
  }

  if (/避审|过审|防封|绕过|反检测|去AI|洗AI|隐藏AI/.test(content)) {
    addFinding(findings, "error", "evasion-language", 1, "", "发布包包含规避审核、检测或 AI 声明的表述。");
  }

  const counts = { error: 0, warn: 0, note: 0 };
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }

  return { path: packagePath, title, tags, findingCount: findings.length, counts, findings };
}

function printResult(result, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  process.stdout.write(`Path: ${result.path}\n`);
  process.stdout.write(`Title: ${result.title || "not found"}\n`);
  process.stdout.write(`Tags: ${result.tags.length}${result.tags.length ? ` (${result.tags.join(", ")})` : ""}\n`);
  process.stdout.write(`Findings: ${result.findingCount} (${result.counts.error} error, ${result.counts.warn} warn, ${result.counts.note} note)\n`);
  for (const finding of result.findings) {
    process.stdout.write(`[${finding.severity.toUpperCase()}] line ${finding.line} ${finding.rule}: ${finding.message}\n`);
    if (finding.sample) {
      process.stdout.write(`  sample: ${finding.sample}\n`);
    }
  }
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    printResult(auditPackage(args), args.json);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
