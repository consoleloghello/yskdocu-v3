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
  metadata: {
    /** 在章节内的题号（从 1 开始，跨题型连续） */
    number: number;
    /** 来源文件 key */
    source: string;
    /** 原始题型名称，如 "选择题" */
    originalType: string;
  };
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
    /** 导入时因源数据问题被跳过的题目 */
    skipped: { source: string; id: string; reason: string }[];
  };
  info: Record<string, SourceInfo>;
  chapters: Chapter[];
  questions: Question[];
}
