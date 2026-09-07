/**
 * 主题（Task 29）—— light / dark，localStorage 持久化。
 *
 * - resolveTheme() 纯函数，可单测
 * - 浏览器读写经 defaultStorage()（localStorage），失败时降级内存
 * - 生效方式：document.documentElement.dataset.theme
 */

import { defaultStorage } from "./learningState.ts";
import type { StorageLike } from "./learningState.ts";

export type Theme = "light" | "dark";

export const THEME_KEY = "yskdocu-v3:theme";

/** 纯函数：已存值优先（非法值忽略），否则跟随系统 */
export function resolveTheme(
  stored: string | null,
  prefersDark: boolean,
): Theme {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark ? "dark" : "light";
}

export function loadTheme(
  storage: StorageLike = defaultStorage(),
): Theme {
  let stored: string | null = null;
  try {
    stored = storage.getItem(THEME_KEY);
  } catch {
    stored = null;
  }
  let prefersDark = false;
  try {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  } catch {
    prefersDark = false;
  }
  return resolveTheme(stored, prefersDark);
}

export function saveTheme(
  storage: StorageLike,
  theme: Theme,
): void {
  try {
    storage.setItem(THEME_KEY, theme);
  } catch {
    // 隐私模式等写入失败时忽略，保持当前会话主题
  }
}

export function applyTheme(theme: Theme): void {
  try {
    document.documentElement.dataset.theme = theme;
  } catch {
    // 非浏览器环境（Deno test）无 document，忽略
  }
}

export function toggleThemeValue(theme: Theme): Theme {
  return theme === "light" ? "dark" : "light";
}
