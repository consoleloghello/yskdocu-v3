/** grading 判分纯函数测试 */

import { assertEquals } from "@std/assert";
import {
  gradeQuestion,
  normalizeBlank,
  splitBlanks,
} from "../src/client/lib/grading.ts";
import type { Question } from "../src/shared/types/content.ts";

const meta = { number: 1, source: "wai", originalType: "选择题" };

const choice: Question = {
  id: "q1",
  chapterId: "c1",
  type: "single_choice",
  options: [
    { key: "A", text: "甲" },
    { key: "B", text: "乙" },
  ],
  content: "选哪个？",
  answer: "B",
  metadata: meta,
};

Deno.test("grading: 选择题 key 相等判对", () => {
  assertEquals(gradeQuestion(choice, "B"), "correct");
  assertEquals(gradeQuestion(choice, "A"), "incorrect");
});

Deno.test("grading: 判断题 boolean 比较", () => {
  const q: Question = {
    ...choice,
    id: "q2",
    type: "true_false",
    answer: true,
  };
  assertEquals(gradeQuestion(q, true), "correct");
  assertEquals(gradeQuestion(q, false), "incorrect");
});

Deno.test("grading: 填空题逐空归一化比较", () => {
  const q: Question = {
    ...choice,
    id: "q3",
    type: "fill_blank",
    content: "水罐 ____ 座，容积 ____ m³",
    answer: ["2", "9923.3"],
  };
  assertEquals(gradeQuestion(q, ["2", "9923.3"]), "correct");
  assertEquals(gradeQuestion(q, [" 2 ", "9923.3"]), "correct");
  assertEquals(gradeQuestion(q, ["3", "9923.3"]), "incorrect");
  assertEquals(gradeQuestion(q, ["2"]), "incorrect");
});

Deno.test("grading: 简答题返回 manual", () => {
  const q: Question = {
    ...choice,
    id: "q4",
    type: "short_answer",
    answer: "参考答案",
  };
  assertEquals(gradeQuestion(q, "任意作答"), "manual");
});

Deno.test("grading: normalizeBlank 去空格并大小写不敏感", () => {
  assertEquals(normalizeBlank("  AbC "), "abc");
});

Deno.test("grading: splitBlanks 切分题干", () => {
  assertEquals(splitBlanks("水罐 ____ 座，容积 ____ m³"), [
    "水罐 ",
    " 座，容积 ",
    " m³",
  ]);
});
