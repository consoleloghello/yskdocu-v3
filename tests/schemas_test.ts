/**
 * Schema 单元测试 —— 纯内联 fixture，不依赖 data/ 产物。
 *
 * 覆盖：Question / Chapter / NormalizedData 的 Zod 运行时校验。
 */

import { assert, assertEquals } from "@std/assert";
import {
  ChapterSchema,
  NormalizedDataSchema,
  QuestionSchema,
} from "../src/shared/schemas/content.ts";

const validChoice = {
  id: "wai-c1-q001",
  chapterId: "wai-c1",
  type: "single_choice",
  options: [
    { key: "A", text: "选项一" },
    { key: "B", text: "选项二" },
  ],
  content: "以下哪项正确？",
  answer: "A",
  metadata: { number: 1, source: "wai", originalType: "选择题" },
};

Deno.test("schema: 合法的选择题通过校验", () => {
  const parsed = QuestionSchema.safeParse(validChoice);
  assert(parsed.success);
  assertEquals(parsed.data.id, "wai-c1-q001");
});

Deno.test("schema: 缺少 id 的题目校验失败", () => {
  const { id: _omitted, ...noId } = validChoice;
  assert(!QuestionSchema.safeParse(noId).success);
});

Deno.test("schema: 非法 type 校验失败", () => {
  assert(
    !QuestionSchema.safeParse({ ...validChoice, type: "essay" }).success,
  );
});

Deno.test("schema: 合法的判断题 / 填空题 / 简答题通过校验", () => {
  const base = {
    chapterId: "nei-c1",
    metadata: { number: 2, source: "nei", originalType: "判断题" },
  };
  assert(
    QuestionSchema.safeParse({
      ...base,
      id: "t1",
      type: "true_false",
      content: "水是液体。",
      answer: true,
    }).success,
  );
  assert(
    QuestionSchema.safeParse({
      ...base,
      id: "t2",
      type: "fill_blank",
      content: "水罐 ____ 座。",
      answer: ["2"],
    }).success,
  );
  assert(
    QuestionSchema.safeParse({
      ...base,
      id: "t3",
      type: "short_answer",
      content: "简述流程。",
      answer: "参考答案",
    }).success,
  );
});

Deno.test("schema: 章节缺少 questionIds 校验失败", () => {
  assert(
    !ChapterSchema.safeParse({ id: "wai-c1", name: "火炬", source: "wai" })
      .success,
  );
});

Deno.test("schema: 完整的 NormalizedData 文档通过校验", () => {
  const doc = {
    meta: {
      sources: ["wai"],
      importedAt: new Date().toISOString(),
      questionCount: 1,
      chapterCount: 1,
    },
    info: { wai: { title: "外操", version: "1", total: 1 } },
    chapters: [
      {
        id: "wai-c1",
        name: "火炬",
        source: "wai",
        questionIds: ["wai-c1-q001"],
      },
    ],
    questions: [validChoice],
  };
  assert(NormalizedDataSchema.safeParse(doc).success);
});
