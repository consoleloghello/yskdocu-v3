/**
 * 首页（Task 13）—— 问候 / 继续学习 / 今日 / 探索。
 *
 * 学习状态来自 learningState（localStorage），目录来自 /api/catalog。
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Catalog } from "../../shared/types/content.ts";
import { apiClient } from "../lib/api.ts";
import { defaultStorage, loadLearningState } from "../lib/learningState.ts";
import type { LearningState } from "../lib/learningState.ts";
import { Button, Card, Skeleton } from "../components/ui.tsx";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 12) return "上午好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function HomePage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [state, setState] = useState<LearningState | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setState(loadLearningState(defaultStorage()));
    apiClient.catalog().then(setCatalog).catch(() => setError(true));
  }, []);

  if (error) return <p>加载失败，请刷新重试。</p>;
  if (!catalog || !state) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
      </div>
    );
  }

  const today = new Date().toDateString();
  const todayRecords = Object.values(state.completed).filter(
    (r) => new Date(r.at).toDateString() === today,
  );
  const todayCorrect = todayRecords.filter((r) => r.correct).length;
  const last = state.lastPosition;
  const lastChapter = last
    ? catalog.chapters.find((c) => c.id === last.chapterId)
    : undefined;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 22, marginBottom: 0 }}>{greeting()} 👋</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
          {catalog.totalQuestions} 题 · {catalog.chapters.length} 个主题
          {todayRecords.length > 0 &&
            ` · 今日已练 ${todayRecords.length} 题，答对 ${todayCorrect} 题`}
        </p>
      </div>

      {/* 继续学习 */}
      {last && lastChapter && (
        <Card>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            继续学习
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, margin: "4px 0 12px" }}>
            {lastChapter.name}
          </div>
          <Link to={`/practice/${lastChapter.id}`}>
            <Button block>继续练习</Button>
          </Link>
        </Card>
      )}

      {/* 探索 */}
      <div>
        <h2 style={{ fontSize: 16 }}>探索</h2>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <Link to="/learn" style={{ textDecoration: "none" }}>
            <Card>
              <div style={{ fontWeight: 600 }}>📚 学习</div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginTop: 4,
                }}
              >
                按主题浏览知识
              </div>
            </Card>
          </Link>
          <Link to="/practice" style={{ textDecoration: "none" }}>
            <Card>
              <div style={{ fontWeight: 600 }}>✏️ 练习</div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginTop: 4,
                }}
              >
                选章节开始答题
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* 收藏与错题入口（数量来自学习状态，列表页 Day 3） */}
      {(state.favorites.length > 0 || state.wrongAnswers.length > 0) && (
        <Card>
          <div style={{ fontSize: 14 }}>
            ⭐ 收藏 {state.favorites.length} 题 · 错题{" "}
            {state.wrongAnswers.length} 题
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            复习页 Day 3 上线后可在此回顾。
          </div>
        </Card>
      )}
    </div>
  );
}
