/**
 * 判分纯函数（Task 16-20）—— 与 React 无关，可 Deno 单测。
 *
 * - 选择 / 判断 / 填空：自动判分
 * - 简答：第一版不做 AI 评分，返回 "manual"，由用户对照参考答案自评
 */

import type { Question } from "../../shared/types/content.ts";

export type GradeStatus = "correct" | "incorrect" | "manual";

/** 用户作答：选择 key / 判断 boolean / 填空 string[] */
export type UserAnswer = string | boolean | string[];

/** 填空归一化：去首尾空格 + 拉丁字符大小写不敏感 */
export function normalizeBlank(s: string): string {
  return s.trim().toLowerCase();
}

export function gradeQuestion(
  question: Question,
  answer: UserAnswer,
): GradeStatus {
  switch (question.type) {
    case "single_choice":
      return typeof answer === "string" && answer === question.answer
        ? "correct"
        : "incorrect";
    case "true_false":
      return typeof answer === "boolean" && answer === question.answer
        ? "correct"
        : "incorrect";
    case "fill_blank": {
      const expected = question.answer;
      if (!Array.isArray(answer) || !Array.isArray(expected)) {
        return "incorrect";
      }
      if (answer.length !== expected.length) return "incorrect";
      const ok = answer.every((a, i) =>
        normalizeBlank(a) === normalizeBlank(expected[i])
      );
      return ok ? "correct" : "incorrect";
    }
    case "short_answer":
      return "manual";
  }
}

/** 把题干按 ____ 切成片段，片段数 = 空数 + 1 */
export function splitBlanks(content: string): string[] {
  return content.split(/_{2,}/);
}
