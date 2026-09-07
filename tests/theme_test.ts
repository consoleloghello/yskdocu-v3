/** theme 主题解析测试（纯函数，无浏览器依赖） */

import { assertEquals } from "@std/assert";
import { resolveTheme, toggleThemeValue } from "../src/client/lib/theme.ts";

Deno.test("theme: 已存值优先，非法值回退到系统偏好", () => {
  assertEquals(resolveTheme("dark", false), "dark");
  assertEquals(resolveTheme("light", true), "light");
  assertEquals(resolveTheme("sepia", true), "dark");
  assertEquals(resolveTheme(null, true), "dark");
  assertEquals(resolveTheme(null, false), "light");
});

Deno.test("theme: toggleThemeValue 来回切换", () => {
  assertEquals(toggleThemeValue("light"), "dark");
  assertEquals(toggleThemeValue("dark"), "light");
});
