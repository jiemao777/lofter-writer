import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { auditDraft, parseArgs } from "./audit-draft.mjs";

function fixture(t, draft, postPackage) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lofter-audit-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const draftPath = path.join(root, "draft.md");
  const postPackagePath = path.join(root, "post-package.md");
  fs.writeFileSync(draftPath, draft, "utf8");
  if (postPackage !== null) {
    fs.writeFileSync(postPackagePath, postPackage, "utf8");
  }
  return { draftPath, postPackagePath };
}

test("reads the real title and tags from the post package", (t) => {
  const files = fixture(
    t,
    "# Draft: rain\n\nStatus: working\n\n## Opening\n\n甲推开窗，雨声正好盖住那句迟到的道歉。\n",
    "# Post Package\n\n## Title\n\n- 雨停之前\n\n## Tags\n\n- CP: #甲乙#\n- IP: #原作#\n\n## AI Disclosure\n\n- Visible note: #AI辅助#\n"
  );
  const result = auditDraft({
    path: files.draftPath,
    postPackagePath: files.postPackagePath,
    characterNames: "甲,乙",
    titleMaxLength: 28,
    aiAssisted: true,
  });

  assert.equal(result.title, "雨停之前");
  assert.deepEqual(result.tags, ["甲乙", "原作"]);
  assert.equal(result.findings.some((finding) => finding.rule === "ai-disclosure-missing"), false);
  assert.equal(result.findings.some((finding) => finding.rule === "speaker-label"), false);
});

test("requires an AI disclosure when AI assistance is declared", (t) => {
  const files = fixture(
    t,
    "# Draft: sample\n\n## Opening\n\n这是一段已经完成、长度足够用于检查的正文内容。它不需要解释所有情绪，只需要让人物完成眼前的选择。\n",
    "# Post Package\n\n## Title\n\n- 门外有人\n\n## Tags\n\n- CP: #甲乙#\n"
  );
  const result = auditDraft({
    path: files.draftPath,
    postPackagePath: files.postPackagePath,
    characterNames: "",
    titleMaxLength: 28,
    aiAssisted: true,
  });

  assert.equal(result.findings.some((finding) => finding.rule === "ai-disclosure-missing"), true);
});

test("finds placeholders, duplicate paragraphs, cliches, and unknown speaker labels", (t) => {
  const repeated = "甲没有回答，只把杯子推回桌子中央，等对面的人先承认他们都知道的那件事。";
  const files = fixture(
    t,
    `# Draft: sample\n\n## Opening\n\n{{OPENING}}\n\n${repeated}\n\n${repeated}\n\n丙：空气仿佛凝固。\n`,
    "# Post Package\n\n## Title\n\n- 对面的位置\n\n## Tags\n\n- CP: #甲乙#\n"
  );
  const result = auditDraft({
    path: files.draftPath,
    postPackagePath: files.postPackagePath,
    characterNames: "甲,乙",
    titleMaxLength: 28,
    aiAssisted: false,
  });
  const rules = new Set(result.findings.map((finding) => finding.rule));

  assert.equal(rules.has("placeholder"), true);
  assert.equal(rules.has("duplicate-paragraph"), true);
  assert.equal(rules.has("cliche-phrase"), true);
  assert.equal(rules.has("speaker-label"), true);
});

test("rejects unknown CLI arguments and invalid title limits", () => {
  assert.throws(() => parseArgs(["--path", "draft.md", "--wat"]), /Unknown argument/);
  assert.throws(
    () => parseArgs(["--path", "draft.md", "--titleMaxLength", "0"]),
    /positive integer/
  );
});
