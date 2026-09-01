/**
 * data:build —— 从 enriched 数据生成 data/generated/ 产物
 *
 * 产出：
 *  catalog.json    — 首页目录（章节概览 + 统计）
 *  chapters.json   — 章节详情（含题 ID 列表 + 分型统计）
 *  questions.json  — 全部题目（含 enrichment）
 */

import type {
  NormalizedData,
  Question,
} from "../../src/shared/types/content.ts";

const INPUT = "data/normalized/enriched.json";
const OUT_DIR = "data/generated";

interface TypeBreakdown {
  single_choice: number;
  true_false: number;
  fill_blank: number;
  short_answer: number;
}

interface CatalogChapter {
  id: string;
  name: string;
  source: string;
  questionCount: number;
  typeBreakdown: TypeBreakdown;
}

interface ChapterDetail extends CatalogChapter {
  questionIds: string[];
}

async function main() {
  await Deno.mkdir(OUT_DIR, { recursive: true });
  const data: NormalizedData = JSON.parse(await Deno.readTextFile(INPUT));

  // ── 按章节分组 ──────────────────────────────────────
  const questionsByChapter = new Map<string, Question[]>();
  for (const q of data.questions) {
    const list = questionsByChapter.get(q.chapterId) ?? [];
    list.push(q);
    questionsByChapter.set(q.chapterId, list);
  }

  function makeBreakdown(qs: Question[]): TypeBreakdown {
    return {
      single_choice: qs.filter((q) => q.type === "single_choice").length,
      true_false: qs.filter((q) => q.type === "true_false").length,
      fill_blank: qs.filter((q) => q.type === "fill_blank").length,
      short_answer: qs.filter((q) => q.type === "short_answer").length,
    };
  }

  // ── catalog.json ────────────────────────────────────
  const catalog: {
    sources: NormalizedData["info"];
    chapters: CatalogChapter[];
    totalQuestions: number;
    buildAt: string;
  } = {
    sources: data.info,
    chapters: data.chapters.map((ch) => {
      const qs = questionsByChapter.get(ch.id) ?? [];
      return {
        id: ch.id,
        name: ch.name,
        source: ch.source,
        questionCount: qs.length,
        typeBreakdown: makeBreakdown(qs),
      };
    }),
    totalQuestions: data.questions.length,
    buildAt: new Date().toISOString(),
  };

  // ── chapters.json ──────────────────────────────────
  const chapters: ChapterDetail[] = data.chapters.map((ch) => {
    const qs = questionsByChapter.get(ch.id) ?? [];
    return {
      id: ch.id,
      name: ch.name,
      source: ch.source,
      questionCount: qs.length,
      typeBreakdown: makeBreakdown(qs),
      questionIds: ch.questionIds,
    };
  });

  // ── questions.json ─────────────────────────────────
  const questions = data.questions;

  // ── 写入 ───────────────────────────────────────────
  const write = (name: string, obj: unknown) =>
    Deno.writeTextFile(
      `${OUT_DIR}/${name}`,
      JSON.stringify(obj, null, 2) + "\n",
    );

  await write("catalog.json", catalog);
  await write("chapters.json", chapters);
  await write("questions.json", questions);

  console.log(
    `▶ Build ${data.questions.length} 题 / ${data.chapters.length} 章`,
  );
  console.log(`   catalog.json   — ${catalog.chapters.length} 章`);
  console.log(`   chapters.json  — ${chapters.length} 章详情`);
  console.log(`   questions.json — ${questions.length} 题`);
  console.log(`✅ → ${OUT_DIR}/`);
}

if (import.meta.main) await main();
