/**
 * v3 运行时校验 Schema（Zod）
 *
 * 用途：
 * 1. data:validate 校验 normalized 数据完整性
 * 2. 后续 API 层可复用做输入校验
 *
 * 原则：以后 v1 JSON 改了，这里能检测出来。
 */

import { z } from "zod";

// ── 枚举 ──────────────────────────────────────────────

export const QuestionTypeSchema = z.enum([
  "single_choice",
  "true_false",
  "fill_blank",
  "short_answer",
]);

// ── 选项 ──────────────────────────────────────────────

export const QuestionOptionSchema = z.object({
  key: z.string().min(1),
  text: z.string().min(1),
});

// ── 题目 ──────────────────────────────────────────────

export const QuestionSchema = z.object({
  id: z.string().min(1),
  chapterId: z.string().min(1),
  type: QuestionTypeSchema,
  options: z.array(QuestionOptionSchema).optional(),
  content: z.string().min(1),
  answer: z.union([z.string(), z.boolean(), z.array(z.string())]),
  subtype: z.string().optional(),
  metadata: z.object({
    number: z.number().int().positive(),
    source: z.string().min(1),
    originalType: z.string().min(1),
  }),
});

// ── 章节 ──────────────────────────────────────────────

export const ChapterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source: z.string().min(1),
  questionIds: z.array(z.string().min(1)),
});

// ── 来源信息 ──────────────────────────────────────────

export const SourceInfoSchema = z.object({
  title: z.string().min(1),
  version: z.string().min(1),
  total: z.number().int().nonnegative(),
});

// ── 整体数据 ──────────────────────────────────────────

export const NormalizedDataSchema = z.object({
  meta: z.object({
    sources: z.array(z.string()),
    importedAt: z.string().min(1),
    questionCount: z.number().int().nonnegative(),
    chapterCount: z.number().int().nonnegative(),
  }),
  info: z.record(z.string(), SourceInfoSchema),
  chapters: z.array(ChapterSchema),
  questions: z.array(QuestionSchema),
});
