/**
 * 内容仓储层 —— 从 data/generated/ 读取产物，提供内存查询接口。
 *
 * 启动时一次性加载（数据量小，801 题 < 1MB），
 * API 层不直接接触文件系统。
 */

import type {
  Catalog,
  ChapterDetail,
  Question,
} from "../../shared/types/content.ts";

// Catalog / CatalogChapter / ChapterDetail 统一定义在 shared/types/content.ts，
// server 与 client 都从 shared 引用，不得跨层直接引用对方模块。

const GEN_DIR = "data/generated";

interface Loaded {
  catalog: Catalog;
  chapters: ChapterDetail[];
  questions: Question[];
  questionById: Map<string, Question>;
  questionsByChapter: Map<string, Question[]>;
}

let cache: Loaded | null = null;

async function load(): Promise<Loaded> {
  if (cache) return cache;

  const read = (name: string) =>
    Deno.readTextFile(`${GEN_DIR}/${name}`).then(JSON.parse);

  const [catalog, chapters, questions] = await Promise.all([
    read("catalog.json") as Promise<Catalog>,
    read("chapters.json") as Promise<ChapterDetail[]>,
    read("questions.json") as Promise<Question[]>,
  ]);

  const questionById = new Map(questions.map((q) => [q.id, q]));
  const questionsByChapter = new Map<string, Question[]>();
  for (const q of questions) {
    const list = questionsByChapter.get(q.chapterId) ?? [];
    list.push(q);
    questionsByChapter.set(q.chapterId, list);
  }

  cache = { catalog, chapters, questions, questionById, questionsByChapter };
  return cache;
}

// ── 查询接口 ──────────────────────────────────────────

export async function getCatalog(): Promise<Catalog> {
  return (await load()).catalog;
}

export async function getChapters(): Promise<ChapterDetail[]> {
  return (await load()).chapters;
}

export async function getChapter(
  id: string,
): Promise<ChapterDetail | undefined> {
  return (await load()).chapters.find((c) => c.id === id);
}

export async function getChapterQuestions(id: string): Promise<Question[]> {
  return (await load()).questionsByChapter.get(id) ?? [];
}

export async function getQuestion(id: string): Promise<Question | undefined> {
  return (await load()).questionById.get(id);
}

export async function getQuestions(
  ids: string[],
): Promise<Question[]> {
  const { questionById } = await load();
  return ids
    .map((id) => questionById.get(id))
    .filter((q): q is Question => q !== undefined);
}

/** 简单全文搜索：题干 + 关键词，返回前 limit 条 */
export async function searchQuestions(
  query: string,
  limit = 20,
): Promise<Question[]> {
  if (!query.trim()) return [];
  const { questions } = await load();
  const q = query.trim().toLowerCase();

  return questions
    .filter((question) => {
      if (question.content.toLowerCase().includes(q)) return true;
      return (question.enrichment?.keywords ?? []).some((k) =>
        k.toLowerCase().includes(q)
      );
    })
    .slice(0, limit);
}
