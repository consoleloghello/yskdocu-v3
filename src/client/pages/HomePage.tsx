import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Catalog } from "../../shared/types/content.ts";
import { apiClient } from "../lib/api.ts";
import { Card, Skeleton } from "../components/ui.tsx";

export function HomePage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient.catalog().then(setCatalog).catch(() => setError(true));
  }, []);

  if (error) return <p>加载失败，请刷新重试。</p>;
  if (!catalog) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <Skeleton height={80} />
        <Skeleton height={80} />
        <Skeleton height={80} />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 22 }}>公用工程题库</h1>
      <p style={{ color: "var(--text-secondary)", marginTop: -8 }}>
        {catalog.totalQuestions} 题 · {catalog.chapters.length} 章
      </p>
      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {catalog.chapters.map((ch) => (
          <Link
            key={ch.id}
            to={`/learn/${ch.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Card>
              <div style={{ fontWeight: 600 }}>{ch.name}</div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  marginTop: 4,
                }}
              >
                {ch.questionCount} 题 · 选择{ch.typeBreakdown.single_choice}
                {" "}
                · 判断{ch.typeBreakdown.true_false} · 填空
                {ch.typeBreakdown.fill_blank} · 简答
                {ch.typeBreakdown.short_answer}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
