/** API 客户端 —— 前端统一请求入口 */

import type {
  Catalog,
  ChapterDetail,
} from "../../server/repositories/contentRepository.ts";
import type { Question } from "../../shared/types/content.ts";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

export const apiClient = {
  catalog: () => get<Catalog>("/api/catalog"),
  chapter: (id: string) =>
    get<ChapterDetail & { questions: Question[] }>(`/api/chapters/${id}`),
  question: (id: string) => get<Question>(`/api/questions/${id}`),
  search: (q: string, limit = 20) =>
    get<{ query: string; count: number; results: Question[] }>(
      `/api/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),
};
