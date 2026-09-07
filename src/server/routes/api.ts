/**
 * Hono API 路由
 *
 * GET /api/health          健康检查
 * GET /api/catalog         目录（章节概览 + 统计）
 * GET /api/collections     合集列表（Collection，即数据来源）
 * GET /api/chapters        章节详情列表
 * GET /api/chapters/:id    单章节（含题目）
 * GET /api/questions       题目列表（?chapterId=&type=&limit=&offset=）
 * GET /api/questions/:id   单题
 * GET /api/search?q=       搜索
 */

import { Hono } from "hono";
import {
  getCatalog,
  getChapter,
  getChapterQuestions,
  getCollections,
  getQuestion,
  listQuestions,
  searchQuestions,
} from "../repositories/contentRepository.ts";
import type { QuestionType } from "../../shared/types/content.ts";

export const api = new Hono();

api.get("/health", (c) => c.json({ ok: true, name: "yskdocu-v3" }));

api.get("/catalog", async (c) => c.json(await getCatalog()));

api.get("/collections", async (c) => c.json(await getCollections()));

api.get(
  "/chapters",
  async (c) => c.json(await getCatalog().then((cat) => cat.chapters)),
);

api.get("/chapters/:id", async (c) => {
  const id = c.req.param("id");
  const chapter = await getChapter(id);
  if (!chapter) return c.json({ error: "chapter not found" }, 404);
  const questions = await getChapterQuestions(id);
  return c.json({ ...chapter, questions });
});

const QUESTION_TYPES: QuestionType[] = [
  "single_choice",
  "true_false",
  "fill_blank",
  "short_answer",
];

api.get("/questions", async (c) => {
  const chapterId = c.req.query("chapterId") || undefined;
  const typeParam = c.req.query("type");
  if (typeParam && !QUESTION_TYPES.includes(typeParam as QuestionType)) {
    return c.json({ error: `invalid type: ${typeParam}` }, 400);
  }
  const limit = Number(c.req.query("limit") ?? 20);
  const offset = Number(c.req.query("offset") ?? 0);
  const { total, results } = await listQuestions({
    chapterId,
    type: (typeParam as QuestionType | undefined) ?? undefined,
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
  });
  return c.json({ total, count: results.length, results });
});

api.get("/questions/:id", async (c) => {
  const question = await getQuestion(c.req.param("id"));
  if (!question) return c.json({ error: "question not found" }, 404);
  return c.json(question);
});

api.get("/search", async (c) => {
  const q = c.req.query("q") ?? "";
  const limit = Number(c.req.query("limit") ?? 20);
  const results = await searchQuestions(q, Number.isFinite(limit) ? limit : 20);
  return c.json({ query: q, count: results.length, results });
});
