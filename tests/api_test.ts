/**
 * Hono API 集成测试 —— 直接调用 api.fetch()，不启动端口。
 * 依赖 data/generated/ 产物（缺失时跳过）。
 *
 * 覆盖：/api/health /api/catalog /api/questions（列表 + 过滤 +
 * 非法 type 400）/api/questions/:id（404）/api/search。
 */

import { assert, assertEquals } from "@std/assert";
import { api } from "../src/server/routes/api.ts";
import { generatedAvailable, skipReason } from "./helpers.ts";

function get(path: string) {
  return api.fetch(new Request(`http://localhost${path}`));
}

Deno.test("api: GET /health 返回 ok", async () => {
  const res = await get("/health");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true, name: "yskdocu-v3" });
});

Deno.test("api: GET /catalog 返回目录", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const res = await get("/catalog");
  assertEquals(res.status, 200);
  const body = await res.json();
  assert(body.totalQuestions > 0);
  assert(body.chapters.length > 0);
});

Deno.test("api: GET /questions 列表 + 题型过滤 + 非法 type 400", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const list = await get("/questions?limit=3");
  assertEquals(list.status, 200);
  const listBody = await list.json();
  assertEquals(listBody.count, 3);
  assert(listBody.total >= 3);

  const filtered = await get("/questions?type=true_false&limit=5");
  assertEquals(filtered.status, 200);
  const filteredBody = await filtered.json();
  assert(
    (filteredBody.results as { type: string }[]).every((q) =>
      q.type === "true_false"
    ),
  );

  const bad = await get("/questions?type=essay");
  assertEquals(bad.status, 400);
});

Deno.test("api: GET /questions/:id 命中与 404", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const first = await (await get("/questions?limit=1")).json();
  const id = first.results[0].id as string;

  const hit = await get(`/questions/${id}`);
  assertEquals(hit.status, 200);
  assertEquals((await hit.json()).id, id);

  const miss = await get("/questions/not-exist");
  assertEquals(miss.status, 404);
});

Deno.test("api: GET /search 空查询返回空结果", async () => {
  if (!await generatedAvailable()) {
    console.warn(skipReason());
    return;
  }
  const res = await get("/search?q=%20%20");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).count, 0);
});
