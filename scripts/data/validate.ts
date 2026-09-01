/**
 * data:validate —— 校验 data/normalized/all.json 的完整性
 *
 * 检查项：
 *  1. JSON 合法 + Schema 结构校验
 *  2. 题目 id 唯一
 *  3. 章节 id 唯一
 *  4. 章节 questionIds 全部指向真实题目
 *  5. 题目 chapterId 指向真实章节
 *  6. 选择题：options 非空、answer 是有效选项 key
 *  7. 判断题：answer 是 boolean
 *  8. 填空题：answer 是 string[]、空位数与答案数一致
 *  9. 简答题：answer 是非空 string
 * 10. 各 source 实际题数 = 声明 total
 */

import { NormalizedDataSchema } from "../../src/shared/schemas/content.ts";
import type {
  NormalizedData,
  Question,
} from "../../src/shared/types/content.ts";

const INPUT = "data/normalized/all.json";

interface Issue {
  level: "error" | "warn";
  message: string;
}

function validate(data: NormalizedData): Issue[] {
  const issues: Issue[] = [];
  const err = (msg: string) => issues.push({ level: "error", message: msg });
  const warn = (msg: string) => issues.push({ level: "warn", message: msg });

  // ── ID 唯一性 ────────────────────────────────────────
  const qIds = new Set<string>();
  for (const q of data.questions) {
    if (qIds.has(q.id)) err(`重复题目 id: ${q.id}`);
    qIds.add(q.id);
  }

  const chIds = new Set<string>();
  for (const ch of data.chapters) {
    if (chIds.has(ch.id)) err(`重复章节 id: ${ch.id}`);
    chIds.add(ch.id);
  }

  // ── 章节 ↔ 题目 引用完整性 ──────────────────────────
  for (const ch of data.chapters) {
    for (const qid of ch.questionIds) {
      if (!qIds.has(qid)) err(`章节 ${ch.id} 引用不存在的题目: ${qid}`);
    }
  }

  for (const q of data.questions) {
    if (!chIds.has(q.chapterId)) {
      err(`题目 ${q.id} 引用不存在的章节: ${q.chapterId}`);
    }
  }

  // ── 按题型逐题校验 ──────────────────────────────────
  for (const q of data.questions) {
    switch (q.type) {
      case "single_choice":
        validateChoice(q, err);
        break;
      case "true_false":
        validateTrueFalse(q, err);
        break;
      case "fill_blank":
        validateFillBlank(q, err, warn);
        break;
      case "short_answer":
        validateShortAnswer(q, err);
        break;
    }
  }

  // ── source 总数校验 ─────────────────────────────────
  for (const key of data.meta.sources) {
    const actual = data.questions.filter((q) =>
      q.metadata.source === key
    ).length;
    const declared = data.info[key].total;
    if (actual !== declared) {
      err(`source ${key}: 实际 ${actual} 题 ≠ 声明 ${declared} 题`);
    }
  }

  return issues;
}

function validateChoice(q: Question, err: (m: string) => void) {
  if (!q.options || q.options.length === 0) {
    err(`❌ ${q.id}: 选择题缺少选项`);
    return;
  }
  if (typeof q.answer !== "string") {
    err(`❌ ${q.id}: 选择题答案应为字符串，实际 ${typeof q.answer}`);
    return;
  }
  if (!q.options.some((o) => o.key === q.answer)) {
    err(
      `❌ ${q.id}: 答案 "${q.answer}" 不在选项 [${
        q.options.map((o) => o.key)
      }] 中`,
    );
  }
  const keys = q.options.map((o) => o.key);
  if (new Set(keys).size !== keys.length) {
    err(`❌ ${q.id}: 选项 key 有重复`);
  }
}

function validateTrueFalse(q: Question, err: (m: string) => void) {
  if (typeof q.answer !== "boolean") {
    err(
      `❌ ${q.id}: 判断题答案应为 boolean，实际 ${typeof q
        .answer}: ${q.answer}`,
    );
  }
}

function validateFillBlank(
  q: Question,
  err: (m: string) => void,
  warn: (m: string) => void,
) {
  if (!Array.isArray(q.answer)) {
    err(`❌ ${q.id}: 填空题答案应为数组，实际 ${typeof q.answer}`);
    return;
  }
  const blanks = (q.content.match(/_{2,}/g) ?? []).length;
  if (blanks === 0) {
    warn(`⚠ ${q.id}: 填空题题干中没有空位（____）`);
  } else if (q.answer.length !== blanks) {
    err(
      `❌ ${q.id}: 填空数 ${blanks} ≠ 答案数 ${q.answer.length}（答案: ${
        JSON.stringify(q.answer)
      }）`,
    );
  }
  if (q.answer.some((a) => a.trim() === "")) {
    err(`❌ ${q.id}: 填空题存在空答案`);
  }
}

function validateShortAnswer(q: Question, err: (m: string) => void) {
  if (typeof q.answer !== "string") {
    err(`❌ ${q.id}: 简答题答案应为字符串，实际 ${typeof q.answer}`);
    return;
  }
  if (q.answer.trim() === "") {
    err(`❌ ${q.id}: 简答题答案为空`);
  }
}

// ── 主流程 ────────────────────────────────────────────

async function main() {
  console.log("▶ 读取 normalized 数据 ...");
  const raw = await Deno.readTextFile(INPUT);
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    console.error("❌ JSON 解析失败");
    Deno.exit(1);
  }

  console.log("▶ Schema 结构校验 ...");
  const parsed = NormalizedDataSchema.safeParse(json);
  if (!parsed.success) {
    console.error("❌ Schema 校验失败：");
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      console.error(`   ${path ? path + ": " : ""}${issue.message}`);
    }
    Deno.exit(1);
  }

  const data = parsed.data as NormalizedData;
  console.log(
    `   ✓ 结构合法 · ${data.meta.chapterCount} 章 · ${data.meta.questionCount} 题`,
  );

  console.log("▶ 业务规则校验 ...");
  const issues = validate(data);

  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");

  if (warns.length > 0) {
    console.warn(`\n⚠ ${warns.length} 条警告：`);
    for (const w of warns) console.warn(`   ${w.message}`);
  }

  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} 条错误：`);
    for (const e of errors) console.error(`   ${e.message}`);
    Deno.exit(1);
  }

  console.log(`\n✅ 校验通过（${warns.length} 条警告）`);
}

if (import.meta.main) await main();
