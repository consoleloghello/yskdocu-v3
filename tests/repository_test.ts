/**
 * Repository 测试 —— 依赖 data/generated/ 产物（缺失时跳过）。
 *
 * 覆盖：getCatalog / getCollections / getChapter / getQuestion /
 * listQuestions（过滤 + 分页）/ searchQuestions（含选项文本）。
 */

import { assert, assertEquals } from "@std/assert";
import {
  getCatalog,
  getChapter,
  getCollections,
  getQuestion,
  listQuestions,
  searchQuestions,
} from "../src/server/repositories/contentRepository.ts";
import { generatedAvailable, skipReason } from "./helpers.ts";

Deno.test("repository: getCatalog 返回章节概览与总数", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const catalog = await getCatalog();
  assert(catalog.totalQuestions > 0);
  assert(catalog.chapters.length > 0);
  const sum = catalog.chapters.reduce((n, c) => n + c.questionCount, 0);
  assertEquals(sum, catalog.totalQuestions);
});

Deno.test("repository: getCollections 按来源聚合章节", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const collections = await getCollections();
  const catalog = await getCatalog();
  assertEquals(collections.length, Object.keys(catalog.sources).length);
  const totalChapters = collections.reduce(
    (n, c) => n + c.chapterIds.length,
    0,
  );
  assertEquals(totalChapters, catalog.chapters.length);
  const totalQuestions = collections.reduce((n, c) => n + c.total, 0);
  assertEquals(totalQuestions, catalog.totalQuestions);
});

Deno.test("repository: getChapter 取到章节详情（含 questionIds）", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const catalog = await getCatalog();
  const first = catalog.chapters[0];
  const detail = await getChapter(first.id);
  assert(detail);
  assertEquals(detail!.id, first.id);
  assertEquals(detail!.questionIds.length, first.questionCount);
  assertEquals(await getChapter("not-exist"), undefined);
});

Deno.test("repository: getQuestion 按 id 取题，缺失返回 undefined", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const catalog = await getCatalog();
  const detail = await getChapter(catalog.chapters[0].id);
  const q = await getQuestion(detail!.questionIds[0]);
  assert(q);
  assertEquals(q!.chapterId, detail!.id);
  assertEquals(await getQuestion("not-exist"), undefined);
});

Deno.test("repository: listQuestions 支持题型过滤与分页", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const page1 = await listQuestions({ type: "single_choice", limit: 5 });
  assert(page1.total > 0);
  assertEquals(page1.results.length, 5);
  assert(page1.results.every((q) => q.type === "single_choice"));

  const page2 = await listQuestions({
    type: "single_choice",
    limit: 5,
    offset: 5,
  });
  assertEquals(page2.total, page1.total);
  assert(
    page2.results.every((q) => !page1.results.some((p) => p.id === q.id)),
    "翻页不应返回重复题目",
  );
});

Deno.test("repository: listQuestions 支持按章节过滤", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const catalog = await getCatalog();
  const chapterId = catalog.chapters[0].id;
  const { total, results } = await listQuestions({ chapterId, limit: 200 });
  assert(total > 0);
  assert(results.every((q) => q.chapterId === chapterId));
});

Deno.test("repository: searchQuestions 命中题干与选项文本", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  assertEquals(await searchQuestions("   "), []);

  // 取一道选择题，用其选项文本做精确搜索，必须命中该题
  const { results } = await listQuestions({ type: "single_choice", limit: 20 });
  const withOptions = results.find((q) => (q.options?.length ?? 0) > 0);
  assert(withOptions, "产物中应存在带选项的选择题");
  const probe = withOptions!.options![0].text.slice(0, 6);
  const hits = await searchQuestions(probe, 50);
  assert(
    hits.some((q) => q.id === withOptions!.id),
    `用选项文本 "${probe}" 应搜到题目 ${withOptions!.id}`,
  );
});
