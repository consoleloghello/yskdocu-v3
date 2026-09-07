/**
 * 内容仓储层 —— 从 data/generated/ 读取产物，提供内存查询接口。
 *
 * 启动时一次性加载（数据量小，801 题 < 1MB），
 * API 层不直接接触文件系统。
 */

import type {
  Catalog,
  ChapterDetail,
  Collection,
  Question,
  QuestionType,
} from "../../shared/types/content.ts";

// Catalog / CatalogChapter / ChapterDetail 统一定义在 shared/types/content.ts，
// server 与 client 都从 shared 引用，不得跨层直接引用对方模块。

const GEN_DIR = new URL("../../../data/generated", import.meta.url).pathname;

interface Loaded {
  catalog: Catalog;
  chapters: ChapterDetail[];
  questions: Question[];
  questionById: Map<string, Question>;
  questionsByChapter: Map<string, Question[]>;
}

let cache: Loaded | null = null;
let loading: Promise<Loaded> | null = null;

async function load(): Promise<Loaded> {
  if (cache) return cache;
  if (loading) return loading;

  loading = (async () => {
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
    loading = null;
    return cache;
  })();

  return loading;
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

/** Collection 列表：从 catalog.sources + chapters 推导（不单独落盘） */
export async function getCollections(): Promise<Collection[]> {
  const { catalog, chapters } = await load();
  return Object.entries(catalog.sources).map(([key, info]) => ({
    key,
    title: info.title,
    version: info.version,
    total: info.total,
    chapterIds: chapters.filter((c) => c.source === key).map((c) => c.id),
  }));
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

export interface ListQuestionsOptions {
  chapterId?: string;
  type?: QuestionType;
  limit?: number;
  offset?: number;
}

/** 题目列表：支持按章节 / 题型过滤 + 分页，供 GET /api/questions 使用 */
export async function listQuestions(
  opts: ListQuestionsOptions = {},
): Promise<{ total: number; results: Question[] }> {
  const { questions } = await load();
  const { chapterId, type } = opts;
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  const filtered = questions.filter((q) => {
    if (chapterId && q.chapterId !== chapterId) return false;
    if (type && q.type !== type) return false;
    return true;
  });

  return {
    total: filtered.length,
    results: filtered.slice(offset, offset + limit),
  };
}

/** 简单全文搜索：题干 + 选项文本 + 关键词，返回前 limit 条 */
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
      if (
        (question.options ?? []).some((o) => o.text.toLowerCase().includes(q))
      ) return true;
      return (question.enrichment?.keywords ?? []).some((k) =>
        k.toLowerCase().includes(q)
      );
    })
    .slice(0, limit);
}
