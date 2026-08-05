#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLICHE_PHRASES = [
  "粉粉嫩嫩",
  "邪魅一笑",
  "小脸小嘴",
  "嘴角勾起一抹弧度",
  "眼底闪过一丝",
  "空气仿佛凝固",
  "时间仿佛静止",
  "心底泛起一丝涟漪",
  "不容置疑的语气",
  "像一只受惊的小鹿",
];

const COMMON_LABELS = new Set([
  "标题",
  "Status",
  "时间",
  "地点",
  "正文",
  "备注",
  "楼主",
  "匿名",
  "系统",
  "旁白",
  "主持人",
  "用户",
]);

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
    postPackagePath: "",
    characterNames: "",
    titleMaxLength: 28,
    aiAssisted: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--path") {
      result.path = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--postPackagePath") {
      result.postPackagePath = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--characterNames") {
      result.characterNames = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--titleMaxLength") {
      result.titleMaxLength = Number.parseInt(requireValue(argv, index, arg), 10);
      index += 1;
    } else if (arg === "--aiAssisted") {
      result.aiAssisted = true;
    } else if (arg === "--json") {
      result.json = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!result.path) {
    throw new Error("Missing required --path argument.");
  }
  if (!Number.isInteger(result.titleMaxLength) || result.titleMaxLength < 1) {
    throw new Error("--titleMaxLength must be a positive integer.");
  }

  return result;
}

function readSource(filePath, label, required) {
  if (!filePath) {
    return null;
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    if (required) {
      throw new Error(`${label} file not found: ${absolutePath}`);
    }
    return null;
  }

  const content = fs.readFileSync(absolutePath, "utf8").replace(/^\uFEFF/, "");
  return { label, path: absolutePath, content, lines: content.split(/\r?\n/) };
}

function findSection(source, headingName) {
  if (!source) {
    return null;
  }

  const wanted = headingName.trim().toLowerCase();
  for (let index = 0; index < source.lines.length; index += 1) {
    const match = source.lines[index].match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match || match[2].trim().toLowerCase() !== wanted) {
      continue;
    }

    const level = match[1].length;
    let end = source.lines.length;
    for (let cursor = index + 1; cursor < source.lines.length; cursor += 1) {
      const nextHeading = source.lines[cursor].match(/^(#{1,6})\s+/);
      if (nextHeading && nextHeading[1].length <= level) {
        end = cursor;
        break;
      }
    }

    return { start: index + 1, end, lines: source.lines.slice(index + 1, end) };
  }

  return null;
}

function cleanListValue(value) {
  return value
    .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, "")
    .trim();
}

function firstSectionValue(section) {
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

function extractTags(source) {
  const section = findSection(source, "Tags");
  if (!section) {
    return [];
  }

  const sectionText = section.lines.join("\n");
  const hashtagValues = [...sectionText.matchAll(/#([^#\r\n]+)#/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  if (hashtagValues.length > 0) {
    return [...new Set(hashtagValues)];
  }

  const values = [];
  for (const line of section.lines) {
    const cleaned = cleanListValue(line);
    if (!cleaned) {
      continue;
    }
    const separator = cleaned.search(/[：:]/);
    const rawValue = separator >= 0 ? cleaned.slice(separator + 1) : cleaned;
    for (const value of rawValue.split(/[、，,]/)) {
      const tag = value.trim().replace(/^#|#$/g, "");
      if (tag && !/^(?:TBD|TODO|None|N\/A)$/i.test(tag)) {
        values.push(tag);
      }
    }
  }
  return [...new Set(values)];
}

function addFinding(findings, severity, rule, source, line, sample, message) {
  findings.push({ severity, rule, source, line, sample, message });
}

function scanPlaceholders(source, findings) {
  const pattern = /{{[^}\n]+}}|\b(?:TBD|TODO)\b/g;
  for (let index = 0; index < source.lines.length; index += 1) {
    const matches = [...source.lines[index].matchAll(pattern)];
    if (matches.length > 0) {
      addFinding(
        findings,
        "error",
        "placeholder",
        source.label,
        index + 1,
        matches.map((match) => match[0]).join(", "),
        "发布文件仍包含未完成的占位内容。"
      );
    }
  }
}

function scanDraftStyle(source, findings) {
  const pseudoPrecisionPattern =
    /第[0-9一二三四五六七八九十]+(?:根|个)(?:指关节|手指|肋骨|神经)|无名指的第[0-9一二三四五六七八九十]+个指关节/;
  const essayTransitionPattern = /^(?:首先|其次|最后|总之)[，,:：]/;

  for (let index = 0; index < source.lines.length; index += 1) {
    const line = source.lines[index];
    for (const phrase of CLICHE_PHRASES) {
      if (line.includes(phrase)) {
        addFinding(
          findings,
          "warn",
          "cliche-phrase",
          source.label,
          index + 1,
          phrase,
          "检查该套话是否符合人物和场景，而不是通用填充。"
        );
      }
    }

    if (pseudoPrecisionPattern.test(line)) {
      addFinding(
        findings,
        "warn",
        "pseudo-precision",
        source.label,
        index + 1,
        line.trim(),
        "出现可疑的精确身体部位描述，请确认是否有情节必要。"
      );
    }

    if (essayTransitionPattern.test(line.trim())) {
      addFinding(
        findings,
        "note",
        "essay-transition",
        source.label,
        index + 1,
        line.trim(),
        "该句更像说明文衔接，请确认是否破坏场景语气。"
      );
    }
  }
}

function scanDuplicateParagraphs(source, findings) {
  const paragraphs = [];
  let current = [];
  let startLine = 0;

  function flush() {
    if (current.length === 0) {
      return;
    }
    const raw = current.join(" ").trim();
    const normalized = raw.replace(/\s+/g, " ").toLowerCase();
    if (normalized.length >= 24 && !/^#{1,6}\s/.test(raw)) {
      paragraphs.push({ raw, normalized, line: startLine });
    }
    current = [];
    startLine = 0;
  }

  for (let index = 0; index < source.lines.length; index += 1) {
    const line = source.lines[index].trim();
    if (!line) {
      flush();
      continue;
    }
    if (current.length === 0) {
      startLine = index + 1;
    }
    current.push(line);
  }
  flush();

  const firstSeen = new Map();
  for (const paragraph of paragraphs) {
    if (firstSeen.has(paragraph.normalized)) {
      addFinding(
        findings,
        "warn",
        "duplicate-paragraph",
        source.label,
        paragraph.line,
        paragraph.raw.slice(0, 120),
        `该段与第 ${firstSeen.get(paragraph.normalized)} 行重复。`
      );
    } else {
      firstSeen.set(paragraph.normalized, paragraph.line);
    }
  }
}

function scanSpeakerLabels(source, characterNames, findings) {
  const allowed = new Set(
    characterNames
      .split(/[,，、]/)
      .map((name) => name.trim())
      .filter(Boolean)
  );
  if (allowed.size === 0) {
    return;
  }

  const reported = new Set();
  const pattern = /^\s*(?:[-*+]\s*)?([\p{L}\p{N}_-]{1,16})\s*[：:]\s*\S/u;
  for (let index = 0; index < source.lines.length; index += 1) {
    const match = source.lines[index].match(pattern);
    if (!match) {
      continue;
    }
    const label = match[1];
    if (!allowed.has(label) && !COMMON_LABELS.has(label) && !reported.has(label)) {
      reported.add(label);
      addFinding(
        findings,
        "note",
        "speaker-label",
        source.label,
        index + 1,
        label,
        "该发言人标签不在提供的人物名单中，请确认是否为遗漏或误名。"
      );
    }
  }
}

function draftBodyLength(source) {
  return source.lines
    .filter((line) => !/^\s*#{1,6}\s/.test(line) && !/^\s*Status\s*[：:]/i.test(line))
    .join("")
    .replace(/\s+/g, "").length;
}

export function auditDraft(options) {
  const draft = readSource(options.path, "draft", true);
  let postPackagePath = options.postPackagePath;
  if (!postPackagePath) {
    const sibling = path.join(path.dirname(draft.path), "post-package.md");
    if (fs.existsSync(sibling)) {
      postPackagePath = sibling;
    }
  }
  const postPackage = readSource(postPackagePath, "post-package", false);
  const findings = [];

  scanPlaceholders(draft, findings);
  scanDraftStyle(draft, findings);
  scanDuplicateParagraphs(draft, findings);
  scanSpeakerLabels(draft, options.characterNames || "", findings);

  if (draftBodyLength(draft) < 80) {
    addFinding(
      findings,
      "note",
      "draft-short",
      draft.label,
      1,
      "",
      "正文内容很短，请确认这不是尚未完成的草稿。"
    );
  }

  let title = "";
  let tags = [];
  if (!postPackage) {
    addFinding(
      findings,
      "warn",
      "post-package-missing",
      "post-package",
      0,
      "",
      "未找到 post-package.md，无法检查真实标题、标签和 AI 声明。"
    );
  } else {
    scanPlaceholders(postPackage, findings);
    const titleValue = firstSectionValue(findSection(postPackage, "Title"));
    if (!titleValue || /^(?:TBD|TODO)$/i.test(titleValue.value)) {
      addFinding(
        findings,
        "error",
        "title-missing",
        postPackage.label,
        titleValue?.line || 1,
        titleValue?.value || "",
        "发布包缺少最终标题。"
      );
    } else {
      title = titleValue.value;
      if (Array.from(title).length > options.titleMaxLength) {
        addFinding(
          findings,
          "warn",
          "title-length",
          postPackage.label,
          titleValue.line,
          title,
          "标题超过配置长度，请确认它仍然清晰易读。"
        );
      }
      if (/：.{6,}/.test(title) || /[“"'「].+[”"'」]/.test(title)) {
        addFinding(
          findings,
          "warn",
          "title-dialogue",
          postPackage.label,
          titleValue.line,
          title,
          "标题像长对白或剧情摘要，请确认这是有意选择。"
        );
      }
    }

    tags = extractTags(postPackage);
    if (tags.length === 0) {
      addFinding(
        findings,
        "error",
        "tags-missing",
        postPackage.label,
        findSection(postPackage, "Tags")?.start || 1,
        "",
        "发布包没有可识别的标签。"
      );
    } else if (tags.length > 10) {
      addFinding(
        findings,
        "warn",
        "tag-count",
        postPackage.label,
        findSection(postPackage, "Tags")?.start || 1,
        tags.join(", "),
        "标签超过 10 个，请检查是否存在无关或重复标签。"
      );
    }

    if (options.aiAssisted && !/(?:#AI(?:生成|辅助)#|AI(?:生成|辅助))/i.test(postPackage.content)) {
      addFinding(
        findings,
        "error",
        "ai-disclosure-missing",
        postPackage.label,
        findSection(postPackage, "AI Disclosure")?.start || 1,
        "",
        "已声明使用 AI 辅助，但发布包缺少 #AI生成# 或 #AI辅助# 标注。"
      );
    }
  }

  const counts = { error: 0, warn: 0, note: 0 };
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }

  return {
    draftPath: draft.path,
    postPackagePath: postPackage?.path || null,
    title,
    tags,
    aiAssisted: Boolean(options.aiAssisted),
    findingCount: findings.length,
    counts,
    findings,
  };
}

function printResult(result, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  process.stdout.write(`Draft: ${result.draftPath}\n`);
  process.stdout.write(`Post package: ${result.postPackagePath || "not found"}\n`);
  process.stdout.write(`Title: ${result.title || "not found"}\n`);
  process.stdout.write(
    `Findings: ${result.findingCount} (${result.counts.error} error, ${result.counts.warn} warn, ${result.counts.note} note)\n`
  );
  for (const finding of result.findings) {
    const location = finding.line > 0 ? ` line ${finding.line}` : "";
    process.stdout.write(
      `[${finding.severity.toUpperCase()}] ${finding.source}${location} ${finding.rule}: ${finding.message}\n`
    );
    if (finding.sample) {
      process.stdout.write(`  sample: ${finding.sample}\n`);
    }
  }
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    printResult(auditDraft(args), args.json);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
