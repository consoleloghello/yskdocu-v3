/**
 * learningState 测试 —— 纯函数 + 内存 Storage，无 I/O、无浏览器依赖。
 */

import { assertEquals } from "@std/assert";
import {
  emptyState,
  loadLearningState,
  masteryRatio,
  memoryStorage,
  recordAnswer,
  saveLearningState,
  setLastPosition,
  STORAGE_KEY,
  toggleFavorite,
} from "../src/client/lib/learningState.ts";

Deno.test("learningState: 空存储返回空状态", () => {
  assertEquals(loadLearningState(memoryStorage()), emptyState());
});

Deno.test("learningState: 损坏的 JSON 返回空状态不抛错", () => {
  const s = memoryStorage();
  s.setItem(STORAGE_KEY, "{broken");
  assertEquals(loadLearningState(s), emptyState());
});

Deno.test("learningState: toggleFavorite 幂等切换", () => {
  const s0 = emptyState();
  const s1 = toggleFavorite(s0, "q1");
  assertEquals(s1.favorites, ["q1"]);
  assertEquals(s0.favorites, [], "原对象不被修改");
  const s2 = toggleFavorite(s1, "q1");
  assertEquals(s2.favorites, []);
});

Deno.test("learningState: recordAnswer 维护 completed/wrong/mastery", () => {
  let s = emptyState();
  s = recordAnswer(s, "q1", "c1", false);
  assertEquals(s.wrongAnswers, ["q1"]);
  assertEquals(masteryRatio(s, "c1"), 0);

  s = recordAnswer(s, "q2", "c1", true);
  assertEquals(s.wrongAnswers, ["q1"]);
  assertEquals(masteryRatio(s, "c1"), 0.5);

  // 同一题答对后移出错题本，不重复计数
  s = recordAnswer(s, "q1", "c1", true);
  assertEquals(s.wrongAnswers, []);
  assertEquals(masteryRatio(s, "c1"), 1);
  assertEquals(masteryRatio(s, "cX"), 0);
});

Deno.test("learningState: setLastPosition 记录位置", () => {
  const s = setLastPosition(emptyState(), "c1", "q9");
  assertEquals(s.lastPosition?.chapterId, "c1");
  assertEquals(s.lastPosition?.questionId, "q9");
});

Deno.test("learningState: save 后 load 往返一致（含派生重建）", () => {
  const s = memoryStorage();
  let state = emptyState();
  state = recordAnswer(state, "q1", "c1", false);
  state = toggleFavorite(state, "q1");
  state = setLastPosition(state, "c1", "q1");
  saveLearningState(s, state);

  const loaded = loadLearningState(s);
  assertEquals(loaded.favorites, ["q1"]);
  assertEquals(loaded.wrongAnswers, ["q1"]);
  assertEquals(masteryRatio(loaded, "c1"), 0);
  assertEquals(loaded.lastPosition?.chapterId, "c1");
});
