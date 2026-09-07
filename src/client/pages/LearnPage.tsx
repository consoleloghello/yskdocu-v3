/**
 * 学习页（Task 14）—— Collection → Topic 浏览 + 掌握度。
 *
 * 与首页的区别：首页是「继续 + 概览」，这里是完整的主题目录，
 * 每个 Topic 显示掌握度进度条，入口通往 /learn/:topicId。
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Catalog, Collection } from "../../shared/types/content.ts";
import { apiClient } from "../lib/api.ts";
import {
  defaultStorage,
  loadLearningState,
  masteryRatio,
} from "../lib/learningState.ts";
import type { LearningState } from "../lib/learningState.ts";
import { Card, Progress, Skeleton } from "../components/ui.tsx";

export function LearnPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [state, setState] = useState<LearningState | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setState(loadLearningState(defaultStorage()));
    Promise.all([apiClient.catalog(), apiClient.collections()])
      .then(([cat, cols]) => {
        setCatalog(cat);
        setCollections(cols);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return <p>加载失败，请刷新重试。</p>;
  if (!catalog || !collections || !state) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Skeleton height={60} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>学习</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: -8 }}>
        {catalog.totalQuestions} 题 · {catalog.chapters.length} 个主题
      </p>
      {collections.map((col) => (
        <section key={col.key} style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 15, color: "var(--text-secondary)" }}>
            {col.title}
          </h2>
          <div style={{ display: "grid", gap: 10 }}>
            {catalog.chapters
              .filter((ch) =>
                col.chapterIds.includes(ch.id)
              )
              .map((ch) => {
                const ratio = masteryRatio(state, ch.id);
                return (
                  <Link
                    key={ch.id}
                    to={`/learn/${ch.id}`}
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
                        <span style={{ fontWeight: 600 }}>{ch.name}</span>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {ch.questionCount} 题
                          {ratio > 0 &&
                            ` · 掌握 ${Math.round(ratio * 100)}%`}
                        </span>
                      </div>
                      {ratio > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <Progress value={ratio} max={1} />
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
