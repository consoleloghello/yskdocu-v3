/**
 * 学习状态（Task 15）—— Local-first，localStorage 持久化。
 *
 * 设计：
 * - 状态是普通 JSON 对象，读写经 load/save，更新经纯函数
 *   （toggleFavorite / recordAnswer / setLastPosition），方便 Deno 单测。
 * - Storage 可注入：浏览器默认 localStorage，非浏览器环境
 *   （如 Deno test）用内存实现，避免直接依赖全局 localStorage。
 */

export interface LastPosition {
  chapterId: string;
  questionId?: string;
  updatedAt: number;
}

export interface AnswerRecord {
  chapterId: string;
  correct: boolean;
  at: number;
}

export interface ChapterMastery {
  answered: number;
  correct: number;
}

export interface LearningState {
  lastPosition?: LastPosition;
  /** 按题 id 记录最近一次作答结果 */
  completed: Record<string, AnswerRecord>;
  favorites: string[];
  /** 答错且尚未答对的题 id */
  wrongAnswers: string[];
  /** 按章节聚合的掌握度（从 completed 推导得出，可重建） */
  mastery: Record<string, ChapterMastery>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const STORAGE_KEY = "yskdocu-v3:learning-state:v1";

export function emptyState(): LearningState {
  return { completed: {}, favorites: [], wrongAnswers: [], mastery: {} };
}

/** 内存 Storage（测试 / 非浏览器环境用） */
export function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, v),
  };
}

let sharedMemory: StorageLike | null = null;

/** 浏览器返回 localStorage，其他环境返回进程内内存实现 */
export function defaultStorage(): StorageLike {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // 忽略（如隐私模式抛异常），降级到内存
  }
  if (!sharedMemory) sharedMemory = memoryStorage();
  return sharedMemory;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** 读取状态；损坏或缺失时返回空状态（不抛错） */
export function loadLearningState(
  storage: StorageLike = defaultStorage(),
): LearningState {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return emptyState();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyState();
    const completed = isRecord(parsed.completed) ? parsed.completed : {};
    // 只保留形状合法的作答记录，其余丢弃
    const cleanCompleted: Record<string, AnswerRecord> = {};
    for (const [id, r] of Object.entries(completed)) {
      if (
        isRecord(r) && typeof r.chapterId === "string" &&
        typeof r.correct === "boolean"
      ) {
        cleanCompleted[id] = {
          chapterId: r.chapterId,
          correct: r.correct,
          at: typeof r.at === "number" ? r.at : Date.now(),
        };
      }
    }
    const favorites = Array.isArray(parsed.favorites)
      ? parsed.favorites.filter((x): x is string => typeof x === "string")
      : [];
    const lastPosition = isRecord(parsed.lastPosition) &&
        typeof parsed.lastPosition.chapterId === "string"
      ? {
        chapterId: parsed.lastPosition.chapterId,
        questionId: typeof parsed.lastPosition.questionId === "string"
          ? parsed.lastPosition.questionId
          : undefined,
        updatedAt: typeof parsed.lastPosition.updatedAt === "number"
          ? parsed.lastPosition.updatedAt
          : Date.now(),
      }
      : undefined;
    // wrongAnswers / mastery 一律从 completed 重建，不信任落盘值
    return rebuildDerived({
      lastPosition,
      completed: cleanCompleted,
      favorites,
      wrongAnswers: [],
      mastery: {},
    });
  } catch {
    return emptyState();
  }
}

/** 重建 wrongAnswers + mastery（从 completed 推导） */
function rebuildDerived(state: LearningState): LearningState {
  const wrongAnswers: string[] = [];
  const mastery: Record<string, ChapterMastery> = {};
  for (const [id, r] of Object.entries(state.completed)) {
    if (!r.correct) wrongAnswers.push(id);
    const m = mastery[r.chapterId] ?? { answered: 0, correct: 0 };
    m.answered += 1;
    if (r.correct) m.correct += 1;
    mastery[r.chapterId] = m;
  }
  return { ...state, wrongAnswers, mastery };
}

export function saveLearningState(
  storage: StorageLike,
  state: LearningState,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** 收藏 / 取消收藏（幂等，返回新对象） */
export function toggleFavorite(
  state: LearningState,
  questionId: string,
): LearningState {
  const has = state.favorites.includes(questionId);
  return {
    ...state,
    favorites: has
      ? state.favorites.filter((id) => id !== questionId)
      : [...state.favorites, questionId],
  };
}

/** 记录一次作答；自动维护 completed / wrongAnswers / mastery */
export function recordAnswer(
  state: LearningState,
  questionId: string,
  chapterId: string,
  correct: boolean,
): LearningState {
  return rebuildDerived({
    ...state,
    completed: {
      ...state.completed,
      [questionId]: { chapterId, correct, at: Date.now() },
    },
  });
}

/** 记录上次学到的位置 */
export function setLastPosition(
  state: LearningState,
  chapterId: string,
  questionId?: string,
): LearningState {
  return {
    ...state,
    lastPosition: { chapterId, questionId, updatedAt: Date.now() },
  };
}

/** 章节掌握度 0~1（无作答返回 0） */
export function masteryRatio(state: LearningState, chapterId: string): number {
  const m = state.mastery[chapterId];
  if (!m || m.answered === 0) return 0;
  return m.correct / m.answered;
}
