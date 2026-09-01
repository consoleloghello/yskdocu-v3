/**
 * data:import —— 读取 data/source/*.json，标准化后写入 data/normalized/all.json
 *
 * 原则：不修改原始 JSON；产物可随时重建。
 * 遇到源数据错误直接报错退出（详细校验由 data:validate 负责）。
 */

import type {
  Chapter,
  NormalizedData,
  Question,
  QuestionOption,
  QuestionType,
  SourceInfo,
} from "../../src/shared/types/content.ts";

const SOURCE_DIR = "data/source";
const OUT_DIR = "data/normalized";

// ── 映射 ──────────────────────────────────────────────

const TYPE_MAP: Record<string, QuestionType> = {
  "选择题": "single_choice",
  "判断题": "true_false",
  "填空题": "fill_blank",
  "简答题": "short_answer",
  "实操分析题": "short_answer",
  "应急处理题": "short_answer",
};

// ── 解析工具 ──────────────────────────────────────────

/** 剥离选项前缀 "A. " / "A、" → { key, text } */
function parseOption(raw: string): QuestionOption {
  const m = raw.match(/^\s*([A-Za-z])\s*[.、．:：]\s*(.*)$/s);
  if (!m) throw new Error(`无法解析选项: "${raw}"`);
  return { key: m[1].toUpperCase(), text: m[2].trim() };
}

/** 判断题答案 → boolean */
function parseTrueFalse(raw: string): boolean {
  const s = raw.trim();
  if (["√", "对", "正确", "Y", "y", "是"].includes(s)) return true;
  if (["×", "x", "X", "错", "错误", "N", "n", "否"].includes(s)) return false;
  throw new Error(`无法解析判断题答案: "${raw}"`);
}

/** 题干中的空位数（连续 2+ 下划线） */
function countBlanks(content: string): number {
  return (content.match(/_{2,}/g) ?? []).length;
}

/**
 * 填空题答案按空位拆分。
 * 按分隔符拆分后数量与空位数一致才拆，否则整体保留（validate 阶段校验）。
 */
function parseFillBlank(content: string, raw: string): string[] {
  const blanks = countBlanks(content);
  const s = raw.trim();
  if (blanks <= 1) return [s];
  const parts = s.split(/\s*[、，,；;]\s*/).map((p) => p.trim()).filter(
    Boolean,
  );
  return parts.length === blanks ? parts : [s];
}

/** 简答题答案剥离 "答案：" / "答：" 前缀 */
function parseShortAnswer(raw: string): string {
  return raw.trim().replace(/^(答案|答)\s*[:：]\s*/s, "").trim();
}

/** 去除题干中误入的序号前缀，如 "1." / "1、" */
function cleanContent(raw: string): string {
  return raw.trim().replace(/^\s*\d+\s*[.、．]\s*/s, "").trim();
}

// ── 原始类型 ──────────────────────────────────────────

interface RawQuestion {
  question: string;
  options?: string[];
  answer: string;
}

interface RawTypeGroup {
  type: string;
  questions: RawQuestion[];
}

interface RawChapter {
  name: string;
  type_groups: RawTypeGroup[];
}

interface RawSource {
  info: { title: string; version: string; total: number };
  chapters: RawChapter[];
}

// ── 导入单个源 ────────────────────────────────────────

async function importSource(
  path: string,
  sourceKey: string,
): Promise<{ info: SourceInfo; chapters: Chapter[]; questions: Question[] }> {
  const raw = JSON.parse(await Deno.readTextFile(path)) as RawSource;
  const info: SourceInfo = { ...raw.info };

  const chapters: Chapter[] = [];
  const questions: Question[] = [];

  for (const [ci, ch] of raw.chapters.entries()) {
    const chapterId = `${sourceKey}-c${ci + 1}`;
    const chapter: Chapter = {
      id: chapterId,
      name: ch.name.trim(),
      source: sourceKey,
      questionIds: [],
    };
    let qNum = 0;

    for (const group of ch.type_groups) {
      const v3Type = TYPE_MAP[group.type];
      if (!v3Type) {
        throw new Error(`未知题型: ${group.type}（章节「${ch.name}」）`);
      }

      for (const rq of group.questions) {
        qNum++;
        const id = `${chapterId}-q${String(qNum).padStart(3, "0")}`;
        const content = cleanContent(rq.question);

        const base = {
          id,
          chapterId,
          type: v3Type,
          content,
          metadata: {
            number: qNum,
            source: sourceKey,
            originalType: group.type,
          },
        };

        let question: Question;
        switch (v3Type) {
          case "single_choice": {
            const options = (rq.options ?? []).map(parseOption);
            const answer = rq.answer.trim().toUpperCase().match(/[A-Z]/)?.[0] ??
              "";
            if (!options.some((o) => o.key === answer)) {
              throw new Error(
                `${id} 答案 "${rq.answer}" 不在选项 [${
                  options.map((o) => o.key)
                }] 中`,
              );
            }
            question = { ...base, type: v3Type, options, answer };
            break;
          }
          case "true_false":
            question = {
              ...base,
              type: v3Type,
              answer: parseTrueFalse(rq.answer),
            };
            break;
          case "fill_blank":
            question = {
              ...base,
              type: v3Type,
              answer: parseFillBlank(content, rq.answer),
            };
            break;
          case "short_answer":
            question = {
              ...base,
              type: v3Type,
              ...(group.type !== "简答题" ? { subtype: group.type } : {}),
              answer: parseShortAnswer(rq.answer),
            };
            break;
        }

        questions.push(question);
        chapter.questionIds.push(id);
      }
    }
    chapters.push(chapter);
  }

  return { info, chapters, questions };
}

// ── 主流程 ────────────────────────────────────────────

async function main() {
  await Deno.mkdir(OUT_DIR, { recursive: true });

  const files = (await Array.fromAsync(Deno.readDir(SOURCE_DIR)))
    .filter((f) => f.isFile && f.name.endsWith(".json"))
    .map((f) => f.name)
    .sort();

  if (files.length === 0) {
    console.error(`❌ ${SOURCE_DIR}/ 中没有找到任何 JSON 文件`);
    Deno.exit(1);
  }

  const data: NormalizedData = {
    meta: { sources: [], importedAt: "", questionCount: 0, chapterCount: 0 },
    info: {},
    chapters: [],
    questions: [],
  };

  for (const file of files) {
    const sourceKey = file.replace(/\.json$/, "");
    console.log(`▶ 导入 ${file} (key: ${sourceKey}) ...`);

    const { info, chapters, questions } = await importSource(
      `${SOURCE_DIR}/${file}`,
      sourceKey,
    );

    data.meta.sources.push(sourceKey);
    data.info[sourceKey] = info;
    data.chapters.push(...chapters);
    data.questions.push(...questions);

    console.log(
      `   ✓ ${info.title} · ${chapters.length} 章 · ${questions.length} 题`,
    );
  }

  data.meta.importedAt = new Date().toISOString();
  data.meta.questionCount = data.questions.length;
  data.meta.chapterCount = data.chapters.length;

  // 完整性：各 source 实际导入数 vs 声明 total
  for (const key of data.meta.sources) {
    const actual = data.questions.filter((q) =>
      q.metadata.source === key
    ).length;
    const declared = data.info[key].total;
    const mark = actual === declared
      ? "✓"
      : `⚠ 实际 ${actual} ≠ 声明 ${declared}`;
    console.log(`   ${key}: ${mark}`);
  }

  const outPath = `${OUT_DIR}/all.json`;
  await Deno.writeTextFile(outPath, JSON.stringify(data, null, 2) + "\n");
  console.log(
    `\n✅ 共 ${data.meta.chapterCount} 章 / ${data.meta.questionCount} 题 → ${outPath}`,
  );
}

if (import.meta.main) await main();
