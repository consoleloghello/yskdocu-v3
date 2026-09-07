/** API 客户端 —— 前端统一请求入口 */

import type {
  Catalog,
  ChapterDetail,
  Collection,
  Question,
  QuestionType,
} from "../../shared/types/content.ts";

export interface ListQuestionsParams {
  chapterId?: string;
  type?: QuestionType;
  limit?: number;
  offset?: number;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const apiClient = {
  catalog: () => get<Catalog>("/api/catalog"),
  collections: () => get<Collection[]>("/api/collections"),
  chapter: (id: string) =>
    get<ChapterDetail & { questions: Question[] }>(`/api/chapters/${id}`),
  questions: (params: ListQuestionsParams = {}) => {
    const sp = new URLSearchParams();
    if (params.chapterId) sp.set("chapterId", params.chapterId);
    if (params.type) sp.set("type", params.type);
    if (params.limit !== undefined) sp.set("limit", String(params.limit));
    if (params.offset !== undefined) sp.set("offset", String(params.offset));
    const qs = sp.size > 0 ? `?${sp}` : "";
    return get<{ total: number; count: number; results: Question[] }>(
      `/api/questions${qs}`,
    );
  },
  question: (id: string) => get<Question>(`/api/questions/${id}`),
  search: (q: string, limit = 20) =>
    get<{ query: string; count: number; results: Question[] }>(
      `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),
};
