import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { auditPackage, parseArgs } from "./audit-package.mjs";

function fixture(t, content) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lofter-package-test-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const packagePath = path.join(root, "post-package.md");
  fs.writeFileSync(packagePath, content, "utf8");
  return packagePath;
}

test("accepts a complete AI-assisted publish package", (t) => {
  const packagePath = fixture(
    t,
    "# Post Package\n\n## Title\n- 雨停之前\n\n## Hook\n- 他们都在等另一个人先开口。\n\n## Summary\n- 一次迟到的和解。\n\n## Tags\n- CP: #甲乙#\n- IP: #原作#\n\n## AI Disclosure\n- 创作说明：本文有 #AI辅助#，已经人工修改。\n"
  );
  const result = auditPackage({ path: packagePath, aiAssisted: true, monetized: false, maxTags: 10, titleMaxLength: 28 });

  assert.equal(result.title, "雨停之前");
  assert.deepEqual(result.tags, ["甲乙", "原作"]);
  assert.equal(result.counts.error, 0);
});

test("finds placeholders, missing disclosure, and monetization cautions", (t) => {
  const packagePath = fixture(
    t,
    "# Post Package\n\n## Title\n- TBD\n\n## Hook\n- TBD\n\n## Summary\n- TBD\n\n## Tags\n- CP:\n\n## AI Disclosure\n- TBD\n"
  );
  const result = auditPackage({ path: packagePath, aiAssisted: true, monetized: true, maxTags: 10, titleMaxLength: 28 });
  const rules = new Set(result.findings.map((finding) => finding.rule));

  assert.equal(rules.has("placeholder"), true);
  assert.equal(rules.has("title-missing"), true);
  assert.equal(rules.has("tags-missing"), true);
  assert.equal(rules.has("ai-disclosure-missing"), true);
  assert.equal(rules.has("monetization-note-missing"), true);
  assert.equal(rules.has("rights-note-missing"), true);
});

test("validates package audit CLI arguments", () => {
  assert.throws(() => parseArgs(["--path", "post.md", "--unknown"]), /Unknown argument/);
  assert.throws(() => parseArgs(["--path", "post.md", "--maxTags", "0"]), /positive integer/);
});
