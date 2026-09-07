/**
 * v3 内容类型定义（shared：前后端 + 数据管线共用）
 *
 * Question.type 统一为 4 种渲染类型；
 * 原始题型（实操分析题 / 应急处理题等）保留在 subtype / originalType 中。
 */

export type QuestionType =
  | "single_choice"
  | "true_false"
  | "fill_blank"
  | "short_answer";

export interface QuestionOption {
  /** 选项字母，如 "A" */
  key: string;
  /** 选项内容（已剥离 "A. " 前缀） */
  text: string;
}

export interface Question {
  /** 全局稳定 ID，如 "wai-c1-q001" */
  id: string;
  /** 所属章节 ID */
  chapterId: string;
  type: QuestionType;
  /** 选择题选项 */
  options?: QuestionOption[];
  /** 题干；填空题用 ____ 表示空位 */
  content: string;
  /** 选择题/判断题：正确选项 key 或 boolean；填空题：按空位拆分的答案数组；简答题：参考答案文本 */
  answer: string | boolean | string[];
  /** 简答题类目的子类型（实操分析 / 应急处理），其余为空 */
  subtype?: string;
  /** Enrich 阶段生成的学习辅助数据 */
  enrichment?: QuestionEnrichment;
  metadata: {
    /** 在章节内的题号（从 1 开始，跨题型连续） */
    number: number;
    /** 来源文件 key */
    source: string;
    /** 原始题型名称，如 "选择题" */
    originalType: string;
  };
}

export interface QuestionEnrichment {
  /** 从答案中提取的关键词 */
  keywords: string[];
  /** 从答案中提取的要点（分点解析） */
  keyPoints: string[];
  /** 简短摘要 */
  summary: string;
}

export interface Chapter {
  /** 如 "wai-c1" */
  id: string;
  /** 章节名，如 "火炬" */
  name: string;
  /** 来源文件 key */
  source: string;
  questionIds: string[];
}

export interface SourceInfo {
  title: string;
  version: string;
  /** 原始声明总数 */
  total: number;
}

export interface NormalizedData {
  /** 导入管线元信息 */
  meta: {
    sources: string[];
    importedAt: string;
    questionCount: number;
    chapterCount: number;
  };
  info: Record<string, SourceInfo>;
  chapters: Chapter[];
  questions: Question[];
}

// ── API / Repository 层共享类型 ──────────────────────────

/**
 * catalog.json 中每个章节的概览条目。
 * 由 data:build 生成，供 GET /api/catalog 返回。
 */
export interface CatalogChapter {
  id: string;
  name: string;
  source: string;
  questionCount: number;
  typeBreakdown: {
    single_choice: number;
    true_false: number;
    fill_blank: number;
    short_answer: number;
  };
}

/**
 * GET /api/catalog 的完整响应结构。
 */
export interface Catalog {
  sources: Record<string, { title: string; version: string; total: number }>;
  chapters: CatalogChapter[];
  totalQuestions: number;
  buildAt: string;
}

/**
 * chapters.json 中每章的详情（含 questionIds）。
 * 由 GET /api/chapters/:id 返回。
 */
export interface ChapterDetail extends CatalogChapter {
  questionIds: string[];
}

// ── 命名映射（plan.md ↔ 实现）────────────────────────────
//
// plan.md 的学习模型是 Collection → Topic → Knowledge；
// 实际数据只有两层（来源 → 章节），映射关系定死如下，
// 全栈统一使用，别名即正名，不再争论：
//
//   Collection ＝ 数据来源（内操版 / 外操版，对应 catalog.sources）
//   Topic      ＝ Chapter（18 章，按工艺系统划分；路由 :topicId 即 chapter id）
//   Knowledge  ＝ QuestionEnrichment（keywords / keyPoints / summary）

/** Topic 即 Chapter：学习路径上的一个主题单元 */
export type Topic = Chapter;

/** Topic 概览（目录用）即 CatalogChapter */
export type TopicOverview = CatalogChapter;

/** Topic 详情（含题目 id 列表）即 ChapterDetail */
export type TopicDetail = ChapterDetail;

/** Knowledge 即题目富化出的知识陈列 */
export type Knowledge = QuestionEnrichment;

/**
 * Collection：一个数据来源（版本）下的合集。
 * 由 repository.getCollections() 从 catalog 推导，不单独落盘。
 */
export interface Collection {
  /** 来源 key，如 "wai" */
  key: string;
  /** 如 "外操版" */
  title: string;
  version: string;
  total: number;
  chapterIds: string[];
}
