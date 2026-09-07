/**
 * 复习页（Task 24 / 26）
 *
 * 数据全部来自 learningState（localStorage）：
 * - 薄弱章节：mastery 未满的已练章节，按掌握度升序
 * - 错题：wrongAnswers（答对后自动移出）
 * - 收藏：favorites 列表
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Catalog, Question } from "../../shared/types/content.ts";
import { apiClient } from "../lib/api.ts";
import { defaultStorage, loadLearningState } from "../lib/learningState.ts";
import type { LearningState } from "../lib/learningState.ts";
import { Card, Progress, Skeleton } from "../components/ui.tsx";
import { QuestionTypeLabel } from "../components/questions.tsx";

function QuestionRow(
  { q, chapterName }: { q: Question; chapterName: string },
) {
  return (
    <Link
      to={`/practice/${q.chapterId}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <span
            style={{ fontSize: 12, color: "var(--text-secondary)" }}
          >
            {QuestionTypeLabel[q.type]} · {chapterName}
          </span>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5 }}>{q.content}</div>
      </Card>
    </Link>
  );
}

export function ReviewPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [state, setState] = useState<LearningState | null>(null);
  const [items, setItems] = useState<Record<string, Question>>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    const s = loadLearningState(defaultStorage());
    setState(s);
    const ids = [...new Set([...s.wrongAnswers, ...s.favorites])];
    Promise.all([
      apiClient.catalog(),
      Promise.all(
        ids.map((id) => apiClient.question(id).catch(() => null)),
      ),
    ])
      .then(([cat, qs]) => {
        setCatalog(cat);
        const map: Record<string, Question> = {};
        for (const q of qs) if (q) map[q.id] = q;
        setItems(map);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return <p>加载失败，请刷新重试。</p>;
  if (!catalog || !state) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Skeleton height={80} />
        <Skeleton height={80} />
      </div>
    );
  }

  const chapterName = (id: string) =>
    catalog.chapters.find((c) => c.id === id)?.name ?? id;

  const weak = Object.entries(state.mastery)
    .filter(([, m]) => m.answered > 0 && m.correct < m.answered)
    .sort((a, b) =>
      (a[1].correct / a[1].answered) -
      (b[1].correct / b[1].answered)
    );

  const wrong = state.wrongAnswers
    .map((id) => items[id])
    .filter((q): q is Question => !!q);
  const favs = state.favorites
    .map((id) => items[id])
    .filter((q): q is Question => !!q);

  const allClear = weak.length === 0 && wrong.length === 0;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ fontSize: 20, marginBottom: 0 }}>复习</h1>

      {allClear && favs.length === 0 && (
        <Card>
          <div style={{ fontSize: 15 }}>🎉 暂无错题，继续保持！</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            去<Link to="/practice">练习</Link>检验一下学习成果吧。
          </div>
        </Card>
      )}

      {weak.length > 0 && (
        <section>
          <h2 style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            薄弱章节
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {weak.map(([chapterId, m]) => (
              <Link
                key={chapterId}
                to={`/practice/${chapterId}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {chapterName(chapterId)}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      答对 {m.correct} / {m.answered} 题
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Progress value={m.correct} max={m.answered} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {wrong.length > 0 && (
        <section>
          <h2 style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            错题 · {wrong.length}
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {wrong.map((q) => (
              <QuestionRow
                key={q.id}
                q={q}
                chapterName={chapterName(q.chapterId)}
              />
            ))}
          </div>
        </section>
      )}

      {favs.length > 0 && (
        <section>
          <h2 style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            收藏 · {favs.length}
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {favs.map((q) => (
              <QuestionRow
                key={q.id}
                q={q}
                chapterName={chapterName(q.chapterId)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
